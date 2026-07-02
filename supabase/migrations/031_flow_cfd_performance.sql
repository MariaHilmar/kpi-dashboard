-- =============================================================================
-- Migration 031 — CFD performático + RPC last sync
-- =============================================================================
-- report_flow_cfd (029) chamava flow_resolve_etapa_on_date por dia×issue
-- (flow_etapa_segments em loop) → statement timeout.
-- Nova versão: expande segmentos uma vez e faz merge por prioridade.

create or replace function public.dashboard_last_issues_synced_at()
returns timestamptz
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select max(i.synced_at) from public.issues i;
$$;

comment on function public.dashboard_last_issues_synced_at() is
  'Timestamp da última sync de issues (header do dashboard). SECURITY DEFINER.';

grant execute on function public.dashboard_last_issues_synced_at()
  to anon, authenticated, service_role;

create or replace function public.report_flow_cfd(
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
  data_referencia date,
  etapa text,
  quantidade bigint
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
  days as (
    select gs::date as ref
    from bounds b,
    generate_series(b.d_start, b.d_end, interval '1 day') gs
    where b.d_start is not null
  ),
  issues_scoped as (
    select i.*
    from public._flow_issues_filtered(
      p_modulo, p_area, p_tipo, p_prioridade, p_equipe, p_status,
      p_parceria, p_sprint, p_epico, p_repositorio, p_situacao,
      p_ano, p_assignee,
      (select d_start from bounds),
      (select d_end from bounds),
      true, false
    ) i
  ),
  issues_com_eventos as (
    select distinct e.issue_key
    from public.issue_status_events e
    inner join issues_scoped i on i.issue_key = e.issue_key
  ),
  segments as (
    select
      i.issue_key,
      seg.valid_from,
      seg.valid_to,
      seg.etapa
    from issues_scoped i
    inner join issues_com_eventos ev on ev.issue_key = i.issue_key
    cross join lateral public.flow_etapa_segments(i.issue_key) seg
  ),
  event_daily as (
    select
      gs::date as data_referencia,
      s.issue_key,
      s.etapa
    from segments s
    cross join bounds b
    cross join lateral generate_series(
      greatest(s.valid_from, b.d_start),
      least(coalesce(s.valid_to, b.d_end), b.d_end),
      interval '1 day'
    ) gs
    where greatest(s.valid_from, b.d_start) <= least(coalesce(s.valid_to, b.d_end), b.d_end)
  ),
  snap_daily as (
    select
      s.snapshot_date as data_referencia,
      s.issue_key,
      s.etapa
    from public.issue_status_snapshots s
    inner join issues_scoped i on i.issue_key = s.issue_key
    cross join bounds b
    where s.snapshot_date between b.d_start and b.d_end
  ),
  proxy_daily as (
    select
      d.ref as data_referencia,
      i.issue_key,
      public.flow_etapa_on_date(i.status, i.estado, i.criado_em, i.fechado_em, d.ref) as etapa
    from days d
    cross join issues_scoped i
    where public.flow_etapa_on_date(i.status, i.estado, i.criado_em, i.fechado_em, d.ref) is not null
  ),
  combined as (
    select data_referencia, issue_key, etapa, 1 as priority from event_daily
    union all
    select data_referencia, issue_key, etapa, 2 as priority from snap_daily
    union all
    select data_referencia, issue_key, etapa, 3 as priority from proxy_daily
  ),
  ranked as (
    select
      c.data_referencia,
      c.issue_key,
      c.etapa,
      row_number() over (
        partition by c.data_referencia, c.issue_key
        order by c.priority
      ) as rn
    from combined c
    where c.etapa is not null
  ),
  daily_etapa as (
    select
      r.data_referencia,
      case
        when i.fechado_em is not null and i.fechado_em::date <= r.data_referencia then 'Concluído'
        else r.etapa
      end as etapa,
      r.issue_key
    from ranked r
    inner join issues_scoped i on i.issue_key = r.issue_key
    where r.rn = 1
  )
  select
    de.data_referencia,
    de.etapa,
    count(*)::bigint as quantidade
  from daily_etapa de
  where de.etapa is not null
  group by de.data_referencia, de.etapa
  order by de.data_referencia, array_position(public.flow_cfd_etapas(), de.etapa);
$$;

create index if not exists idx_issue_status_events_issue_key
  on public.issue_status_events (issue_key);

comment on function public.report_flow_cfd is
  'CFD diário: eventos (segmentos) > snapshots > proxy. Otimizado para evitar N×M chamadas PL/pgSQL.';
