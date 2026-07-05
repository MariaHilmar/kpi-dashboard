-- Migration 043 — Roadmap executivo por milestone (issue #45)
-- Entregas sprint a sprint agrupadas por módulo ou épico (top N por sprint).

create or replace function public.report_milestone_roadmap(
  p_from_iid integer,
  p_to_iid integer,
  p_group_by text default 'modulo',
  p_top_n integer default 5
)
returns table (
  milestone_iid integer,
  milestone_titulo text,
  milestone_start_date date,
  milestone_due_date date,
  label text,
  rank_in_sprint integer,
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
  group_dimension as (
    select case
      when lower(trim(coalesce(p_group_by, ''))) in ('epico', 'épico') then 'epico'
      else 'modulo'
    end as dimension
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
        gd.dimension,
        i.parceria, i.repositorio, i.area_funcional, i.desenvolvedor, i.dev_mergeado,
        i.modulo, i.tipo, i.prioridade,
        coalesce(nullif(trim(i.status), ''), nullif(trim(mi.status), '')),
        i.equipe, i.epico, i.sprint, i.categoria,
        i.modulo_ok, i.area_ok, i.padrao_titulo, i.padrao_completo
      ) as lbl,
      coalesce(i.fechado_em, mi.fechado_em) as fechado_em,
      coalesce(mi.story_points, mi.gitlab_weight, 0) as story_points,
      mir.start_date,
      mir.due_date
    from milestones_in_range mir
    cross join group_dimension gd
    join public.milestone_issues mi on mi.milestone_id = mir.milestone_id
    left join public.issues i on i.issue_key = mi.issue_key
  ),
  delivered as (
    select
      s.gitlab_milestone_iid,
      s.milestone_titulo,
      s.lbl as label,
      count(*)::bigint as entregues,
      coalesce(sum(s.story_points), 0)::bigint as pontos_entregues
    from scoped s
    where s.fechado_em is not null
      and s.start_date is not null
      and s.due_date is not null
      and s.fechado_em::date between s.start_date and s.due_date
    group by s.gitlab_milestone_iid, s.milestone_titulo, s.lbl
  ),
  ranked as (
    select
      d.*,
      row_number() over (
        partition by d.gitlab_milestone_iid
        order by d.entregues desc, d.pontos_entregues desc, d.label asc
      )::integer as rank_in_sprint
    from delivered d
  )
  select
    r.gitlab_milestone_iid as milestone_iid,
    r.milestone_titulo,
    mir.start_date as milestone_start_date,
    mir.due_date as milestone_due_date,
    r.label,
    r.rank_in_sprint,
    r.entregues,
    r.pontos_entregues
  from ranked r
  join milestones_in_range mir on mir.gitlab_milestone_iid = r.gitlab_milestone_iid
  where r.rank_in_sprint <= greatest(coalesce(nullif(p_top_n, 0), 5), 1)
  order by r.gitlab_milestone_iid asc, r.rank_in_sprint asc, r.label asc;
$$;

comment on function public.report_milestone_roadmap(integer, integer, text, integer) is
  'Roadmap PMO: top entregas por módulo ou épico em cada milestone GitLab no intervalo de IIDs — timeline sprint a sprint.';

grant execute on function public.report_milestone_roadmap(integer, integer, text, integer) to authenticated, service_role;
