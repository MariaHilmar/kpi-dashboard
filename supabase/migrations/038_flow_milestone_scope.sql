-- Migration 038 — Escopo milestone em dwell e lead time (issue #35)
-- Reutiliza lógica de report_flow_stage_dwell / report_flow_lead_time_detail;
-- adiciona p_milestone_iid opcional + CTE de issues entregues na sprint.

-- -----------------------------------------------------------------------------
-- Issues entregues na milestone (fechado_em ∈ [start_date, due_date])
-- -----------------------------------------------------------------------------
create or replace function public._milestone_delivered_issue_keys(p_milestone_iid integer)
returns table (issue_key text)
language sql
stable
as $$
  select mi.issue_key
  from public.milestones m
  join public.milestone_issues mi on mi.milestone_id = m.id
  left join public.issues i on i.issue_key = mi.issue_key
  where m.gitlab_milestone_iid = p_milestone_iid
    and m.start_date is not null
    and m.due_date is not null
    and coalesce(i.fechado_em, mi.fechado_em) is not null
    and coalesce(i.fechado_em, mi.fechado_em)::date between m.start_date and m.due_date;
$$;

comment on function public._milestone_delivered_issue_keys(integer) is
  'Issue keys entregues na janela start_date–due_date da milestone (snapshot milestone_issues + issues).';

-- -----------------------------------------------------------------------------
-- report_flow_stage_dwell — parâmetro opcional p_milestone_iid
-- -----------------------------------------------------------------------------
drop function if exists public.report_flow_stage_dwell(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, date, date
);

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
  p_end_date date default null,
  p_milestone_iid integer default null
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
  with milestone_ctx as (
    select m.start_date, m.due_date
    from public.milestones m
    where m.gitlab_milestone_iid = p_milestone_iid
    limit 1
  ),
  bounds as (
    select
      coalesce(
        (select mc.start_date from milestone_ctx mc where p_milestone_iid is not null),
        p_start_date,
        date_trunc('year', current_date)::date
      ) as d_start,
      coalesce(
        (select mc.due_date from milestone_ctx mc where p_milestone_iid is not null),
        p_end_date,
        current_date
      ) as d_end
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
      and (
        p_milestone_iid is null
        or i.issue_key in (
          select dk.issue_key
          from public._milestone_delivered_issue_keys(p_milestone_iid) dk
        )
      )
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
  'Com p_milestone_iid: recorte automático por milestone_issues entregues na sprint.';

-- -----------------------------------------------------------------------------
-- report_flow_lead_time_detail — parâmetro opcional p_milestone_iid
-- -----------------------------------------------------------------------------
drop function if exists public.report_flow_lead_time_detail(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, date, date
);

create or replace function public.report_flow_lead_time_detail(
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
  p_end_date date default null,
  p_milestone_iid integer default null
)
returns table (
  issue_id uuid,
  issue_key text,
  titulo text,
  data_inicio_fluxo date,
  data_inicio_cycle date,
  data_conclusao date,
  lead_time_dias integer,
  cycle_time_dias integer
)
language sql
stable
set search_path = public, pg_temp
as $$
  with milestone_ctx as (
    select m.start_date, m.due_date
    from public.milestones m
    where m.gitlab_milestone_iid = p_milestone_iid
    limit 1
  ),
  bounds as (
    select
      coalesce(
        (select mc.start_date from milestone_ctx mc where p_milestone_iid is not null),
        p_start_date,
        date_trunc('year', current_date)::date
      ) as d_start,
      coalesce(
        (select mc.due_date from milestone_ctx mc where p_milestone_iid is not null),
        p_end_date,
        current_date
      ) as d_end
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
      and i.fechado_em::date between b.d_start and b.d_end
      and i.criado_em is not null
      and (
        p_milestone_iid is null
        or i.issue_key in (
          select dk.issue_key
          from public._milestone_delivered_issue_keys(p_milestone_iid) dk
        )
      )
  )
  select
    s.id as issue_id,
    s.issue_key,
    s.titulo,
    s.criado_em::date as data_inicio_fluxo,
    public.flow_data_inicio_cycle(s.issue_key, s.criado_em) as data_inicio_cycle,
    s.fechado_em::date as data_conclusao,
    greatest((s.fechado_em::date - s.criado_em::date), 0)::integer as lead_time_dias,
    greatest(
      (s.fechado_em::date - public.flow_data_inicio_cycle(s.issue_key, s.criado_em)),
      0
    )::integer as cycle_time_dias
  from scoped s
  order by lead_time_dias desc nulls last;
$$;

comment on function public.report_flow_lead_time_detail is
  'Lead time por issue concluída no período. Com p_milestone_iid: recorte por milestone_issues entregues na sprint.';

-- -----------------------------------------------------------------------------
-- Wrappers milestone (API simétrica a report_milestone_throughput)
-- -----------------------------------------------------------------------------
create or replace function public.report_milestone_stage_dwell(p_milestone_iid integer)
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
security definer
set search_path = public, pg_temp
as $$
  select *
  from public.report_flow_stage_dwell(p_milestone_iid := p_milestone_iid);
$$;

comment on function public.report_milestone_stage_dwell(integer) is
  'Dwell por etapa Kanban para issues entregues na milestone — delega a report_flow_stage_dwell.';

create or replace function public.report_milestone_lead_time_detail(p_milestone_iid integer)
returns table (
  issue_id uuid,
  issue_key text,
  titulo text,
  data_inicio_fluxo date,
  data_inicio_cycle date,
  data_conclusao date,
  lead_time_dias integer,
  cycle_time_dias integer
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select *
  from public.report_flow_lead_time_detail(p_milestone_iid := p_milestone_iid);
$$;

comment on function public.report_milestone_lead_time_detail(integer) is
  'Lead time por issue entregue na milestone — delega a report_flow_lead_time_detail.';

-- -----------------------------------------------------------------------------
-- Grants e security definer
-- -----------------------------------------------------------------------------
alter function public.report_flow_stage_dwell(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, date, date, integer
) security definer set search_path = public, pg_temp;

alter function public.report_flow_lead_time_detail(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, date, date, integer
) security definer set search_path = public, pg_temp;

grant execute on function public.report_flow_stage_dwell(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, date, date, integer
) to anon, authenticated, service_role;

grant execute on function public.report_flow_lead_time_detail(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, date, date, integer
) to anon, authenticated, service_role;

grant execute on function public.report_milestone_stage_dwell(integer) to authenticated, service_role;
grant execute on function public.report_milestone_lead_time_detail(integer) to authenticated, service_role;
