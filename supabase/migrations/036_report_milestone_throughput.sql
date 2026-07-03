-- Migration 036 — Throughput intra-sprint (wrapper sobre report_flow_throughput)
-- Issue #33: recorte automático pela janela start_date–due_date da milestone.

create or replace function public.report_milestone_throughput(
  p_milestone_iid integer,
  p_granularity text default 'week'
)
returns table (
  periodo text,
  quantidade_concluida bigint,
  story_points bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with milestone_bounds as (
    select
      m.id as milestone_id,
      m.start_date,
      m.due_date
    from public.milestones m
    where m.gitlab_milestone_iid = p_milestone_iid
    limit 1
  ),
  flow_rows as (
    select
      f.periodo,
      f.quantidade_concluida
    from milestone_bounds mb
    cross join lateral public.report_flow_throughput(
      null, null, null, null, null, null, null, null, null, null, null, null, null,
      mb.start_date,
      mb.due_date,
      p_granularity
    ) f
    where mb.start_date is not null
      and mb.due_date is not null
  ),
  points_rows as (
    select
      case
        when coalesce(p_granularity, 'week') = 'month'
          then to_char(date_trunc('month', mi.fechado_em::date), 'YYYY-MM')
        else to_char(mi.fechado_em::date, 'IYYY') || '-W' || lpad(to_char(mi.fechado_em::date, 'IW'), 2, '0')
      end as periodo,
      coalesce(sum(coalesce(mi.story_points, 0)), 0)::bigint as story_points
    from milestone_bounds mb
    join public.milestone_issues mi on mi.milestone_id = mb.milestone_id
    where mb.start_date is not null
      and mb.due_date is not null
      and mi.fechado_em is not null
      and mi.fechado_em::date between mb.start_date and mb.due_date
    group by 1
  )
  select
    f.periodo,
    f.quantidade_concluida,
    coalesce(p.story_points, 0)::bigint as story_points
  from flow_rows f
  left join points_rows p on p.periodo = f.periodo
  order by f.periodo;
$$;

comment on function public.report_milestone_throughput(integer, text) is
  'Throughput semanal/mensal intra-sprint: delega a report_flow_throughput com datas da milestone + série opcional de story points (milestone_issues).';

grant execute on function public.report_milestone_throughput(integer, text) to authenticated;
grant execute on function public.report_milestone_throughput(integer, text) to service_role;
