-- =============================================================================
-- Migration 033 — Qualidade do histórico Kanban no recorte (CFD scope)
-- =============================================================================
-- Classifica issues ativas no período: eventos > snapshot > proxy (mesma prioridade do CFD).

create or replace function public.report_flow_data_quality(
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
  total_issues bigint,
  com_eventos bigint,
  com_snapshot_apenas bigint,
  com_proxy bigint,
  pct_eventos_reais numeric,
  pct_snapshot_apenas numeric,
  pct_proxy numeric
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with bounds as (
    select
      coalesce(p_start_date, (select min(criado_em::date) from public.issues)) as d_start,
      coalesce(p_end_date, current_date) as d_end
  ),
  issues_scoped as (
    select i.issue_key
    from public._flow_issues_filtered(
      p_modulo, p_area, p_tipo, p_prioridade, p_equipe, p_status,
      p_parceria, p_sprint, p_epico, p_repositorio, p_situacao,
      p_ano, p_assignee,
      (select d_start from bounds),
      (select d_end from bounds),
      true, false
    ) i
  ),
  classified as (
    select
      s.issue_key,
      case
        when exists (
          select 1
          from public.issue_status_events e
          where e.issue_key = s.issue_key
        ) then 'eventos'
        when exists (
          select 1
          from public.issue_status_snapshots snap
          cross join bounds b
          where snap.issue_key = s.issue_key
            and snap.snapshot_date between b.d_start and b.d_end
        ) then 'snapshot'
        else 'proxy'
      end as fonte
    from issues_scoped s
  )
  select
    count(*)::bigint as total_issues,
    count(*) filter (where c.fonte = 'eventos')::bigint as com_eventos,
    count(*) filter (where c.fonte = 'snapshot')::bigint as com_snapshot_apenas,
    count(*) filter (where c.fonte = 'proxy')::bigint as com_proxy,
    round(
      100.0 * count(*) filter (where c.fonte = 'eventos') / nullif(count(*), 0),
      1
    ) as pct_eventos_reais,
    round(
      100.0 * count(*) filter (where c.fonte = 'snapshot') / nullif(count(*), 0),
      1
    ) as pct_snapshot_apenas,
    round(
      100.0 * count(*) filter (where c.fonte = 'proxy') / nullif(count(*), 0),
      1
    ) as pct_proxy
  from classified c;
$$;

comment on function public.report_flow_data_quality is
  'Cobertura de histórico Kanban no recorte CFD: eventos GitLab, snapshot diário ou proxy (status atual).';

grant execute on function public.report_flow_data_quality(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, date, date
) to anon, authenticated, service_role;
