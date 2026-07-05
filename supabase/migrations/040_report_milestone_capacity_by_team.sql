-- Migration 040 — Capacidade por equipe sprint a sprint (issue #44)
-- Série equipe × milestone com issues/pontos entregues no intervalo da sprint.

create or replace function public.report_milestone_capacity_by_team(
  p_from_iid integer,
  p_to_iid integer
)
returns table (
  milestone_iid integer,
  milestone_titulo text,
  equipe text,
  entregues bigint,
  pontos_entregues bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with bounds as (
    select
      least(p_from_iid, p_to_iid) as from_iid,
      greatest(p_from_iid, p_to_iid) as to_iid
  ),
  milestones_in_range as (
    select
      m.id as milestone_id,
      m.gitlab_milestone_iid,
      m.titulo,
      m.start_date,
      m.due_date
    from public.milestones m
    cross join bounds b
    where m.gitlab_milestone_iid is not null
      and m.gitlab_milestone_iid between b.from_iid and b.to_iid
  ),
  scoped as (
    select
      mir.gitlab_milestone_iid,
      mir.titulo as milestone_titulo,
      public._milestone_dimension_label(
        'equipe',
        i.parceria, i.repositorio, i.area_funcional, i.desenvolvedor, i.dev_mergeado,
        i.modulo, i.tipo, i.prioridade,
        coalesce(nullif(trim(i.status), ''), nullif(trim(mi.status), '')),
        i.equipe, i.epico, i.sprint, i.categoria,
        i.modulo_ok, i.area_ok, i.padrao_titulo, i.padrao_completo
      ) as equipe,
      coalesce(i.fechado_em, mi.fechado_em) as fechado_em,
      coalesce(mi.story_points, mi.gitlab_weight, 0) as story_points,
      mir.start_date,
      mir.due_date
    from milestones_in_range mir
    join public.milestone_issues mi on mi.milestone_id = mir.milestone_id
    left join public.issues i on i.issue_key = mi.issue_key
  ),
  delivered as (
    select
      s.gitlab_milestone_iid,
      s.milestone_titulo,
      s.equipe,
      count(*)::bigint as entregues,
      coalesce(sum(s.story_points), 0)::bigint as pontos_entregues
    from scoped s
    where s.fechado_em is not null
      and s.start_date is not null
      and s.due_date is not null
      and s.fechado_em::date between s.start_date and s.due_date
    group by s.gitlab_milestone_iid, s.milestone_titulo, s.equipe
  )
  select
    d.gitlab_milestone_iid as milestone_iid,
    d.milestone_titulo,
    d.equipe,
    d.entregues,
    d.pontos_entregues
  from delivered d
  order by d.gitlab_milestone_iid asc, d.equipe asc;
$$;

comment on function public.report_milestone_capacity_by_team(integer, integer) is
  'Capacidade entregue por equipe (label equipe normalizado) em cada milestone GitLab no intervalo de IIDs — métrica gerencial sprint a sprint.';

grant execute on function public.report_milestone_capacity_by_team(integer, integer) to authenticated, service_role;
