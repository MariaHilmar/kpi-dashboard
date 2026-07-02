-- =============================================================================
-- Migration 032 — Tempo de permanência (dwell) por etapa Kanban
-- =============================================================================
-- Agrega dias por etapa a partir de flow_etapa_segments (issue_status_events).
-- Escopo: issues concluídas no período. Proxy quando não há eventos.

create or replace function public.flow_dwell_etapas()
returns text[]
language sql
immutable
as $$
  select array[
    'Backlog', 'A Fazer', 'Em Desenvolvimento', 'Em Teste', 'Homologação'
  ]::text[];
$$;

comment on function public.flow_dwell_etapas() is
  'Etapas Kanban incluídas no relatório de dwell time (exclui Concluído/Cancelado).';

create or replace function public.report_flow_stage_dwell(
  p_modulo text default null,
  p_area text default null,
  p_tipo text default null,
  p_prioridade text default null,
  p_equipe text default null,
  p_status text default null,
  p_parceria text default null,
  p_sprint text default null,
  p_epico text default null,
  p_repositorio text default null,
  p_situacao text default null,
  p_ano integer default null,
  p_assignee text default null,
  p_start_date date default null,
  p_end_date date default null
)
returns table (
  etapa text,
  tempo_medio_dias numeric,
  tempo_mediano_dias numeric,
  quantidade_issues bigint,
  issues_total_periodo bigint,
  issues_com_proxy bigint
)
language sql
stable
set search_path = public, pg_temp
as $$
  with bounds as (
    select
      coalesce(p_start_date, date_trunc('year', current_date)::date) as d_start,
      coalesce(p_end_date, current_date) as d_end
  ),
  scoped as (
    select i.*
    from public._flow_issues_filtered(
      p_modulo, p_area, p_tipo, p_prioridade, p_equipe, p_status,
      p_parceria, p_sprint, p_epico, p_repositorio, p_situacao,
      p_ano, p_assignee, null, null, false, false
    ) i
    cross join bounds b
    where i.fechado_em is not null
      and i.criado_em is not null
      and i.fechado_em::date between b.d_start and b.d_end
  ),
  meta as (
    select
      count(*)::bigint as issues_total_periodo,
      count(*) filter (
        where not exists (
          select 1
          from public.issue_status_events e
          where e.issue_key = scoped.issue_key
        )
      )::bigint as issues_com_proxy
    from scoped
  ),
  segment_days as (
    select
      i.issue_key,
      seg.etapa,
      greatest(
        0,
        (
          least(coalesce(seg.valid_to, i.fechado_em::date), i.fechado_em::date)
          - greatest(seg.valid_from, i.criado_em::date)
          + 1
        )
      )::numeric as dias
    from scoped i
    cross join lateral public.flow_etapa_segments(i.issue_key) seg
    where exists (
        select 1
        from public.issue_status_events e
        where e.issue_key = i.issue_key
      )
      and seg.etapa = any (public.flow_dwell_etapas())
      and least(coalesce(seg.valid_to, i.fechado_em::date), i.fechado_em::date)
          >= greatest(seg.valid_from, i.criado_em::date)
  ),
  proxy_days as (
    select
      i.issue_key,
      public.flow_map_etapa(i.status, i.estado) as etapa,
      (i.fechado_em::date - i.criado_em::date + 1)::numeric as dias
    from scoped i
    where not exists (
        select 1
        from public.issue_status_events e
        where e.issue_key = i.issue_key
      )
      and public.flow_map_etapa(i.status, i.estado) = any (public.flow_dwell_etapas())
  ),
  all_days as (
    select issue_key, etapa, dias
    from segment_days
    where dias > 0
    union all
    select issue_key, etapa, dias
    from proxy_days
    where dias > 0
  ),
  issue_stage_totals as (
    select
      issue_key,
      etapa,
      sum(dias) as dias
    from all_days
    group by issue_key, etapa
  ),
  aggregated as (
    select
      ist.etapa,
      round(avg(ist.dias), 2) as tempo_medio_dias,
      round(
        (percentile_cont(0.5) within group (order by ist.dias))::numeric,
        2
      ) as tempo_mediano_dias,
      count(*)::bigint as quantidade_issues
    from issue_stage_totals ist
    group by ist.etapa
  )
  select
    e.etapa,
    agg.tempo_medio_dias,
    agg.tempo_mediano_dias,
    coalesce(agg.quantidade_issues, 0::bigint) as quantidade_issues,
    m.issues_total_periodo,
    m.issues_com_proxy
  from unnest(public.flow_dwell_etapas()) as e(etapa)
  cross join meta m
  left join aggregated agg on agg.etapa = e.etapa
  order by array_position(public.flow_dwell_etapas(), e.etapa);
$$;

comment on function public.report_flow_stage_dwell is
  'Tempo médio/mediano de permanência por etapa Kanban (issues concluídas no período). '
  'Segmentos via issue_status_events; proxy atribui todo lead time à etapa final quando sem eventos.';

alter function public.report_flow_stage_dwell(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, date, date
) security definer set search_path = public, pg_temp;

grant execute on function public.report_flow_stage_dwell(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, date, date
) to anon, authenticated, service_role;
