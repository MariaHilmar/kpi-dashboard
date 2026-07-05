-- Migration 048 — Capacidade por equipe: incluir fechadas alinhadas ao KPI da página Sprint
-- issues fechadas = issues.sprint compatível com milestone + fechado = true (mesma base do dashboard_kpis_full)

create or replace function public._milestone_matches_issue_sprint(
  p_milestone_titulo text,
  p_milestone_iid integer,
  p_issue_sprint text
)
returns boolean
language sql
immutable
as $$
  select
    coalesce(trim(p_issue_sprint), '') <> ''
    and (
      trim(p_issue_sprint) = trim(p_milestone_titulo)
      or trim(p_issue_sprint) ~ (
        '^Sprint\s+' || p_milestone_iid::text || '(\s|-|$)'
      )
    );
$$;

comment on function public._milestone_matches_issue_sprint(text, integer, text) is
  'True quando issues.sprint corresponde ao título ou ao IID da milestone GitLab (ex.: Sprint 90 - Contratos).';

-- Retorno alterado (coluna fechadas): CREATE OR REPLACE não basta — exige DROP antes.
drop function if exists public.report_milestone_capacity_by_team(integer, integer);

create or replace function public.report_milestone_capacity_by_team(
  p_from_iid integer,
  p_to_iid integer
)
returns table (
  milestone_iid integer,
  milestone_titulo text,
  equipe text,
  fechadas bigint,
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
  ),
  closed_by_team as (
    select
      mir.gitlab_milestone_iid,
      mir.titulo as milestone_titulo,
      coalesce(nullif(trim(i.equipe), ''), 'Não informado') as equipe,
      count(*)::bigint as fechadas
    from milestones_in_range mir
    join public.issues i
      on public._milestone_matches_issue_sprint(mir.titulo, mir.gitlab_milestone_iid, i.sprint)
    where coalesce(i.ano_criacao, 0) >= 2024
      and i.fechado is true
    group by mir.gitlab_milestone_iid, mir.titulo, 3
  ),
  combined as (
    select
      coalesce(c.gitlab_milestone_iid, d.gitlab_milestone_iid) as gitlab_milestone_iid,
      coalesce(c.milestone_titulo, d.milestone_titulo) as milestone_titulo,
      coalesce(c.equipe, d.equipe) as equipe,
      coalesce(c.fechadas, 0)::bigint as fechadas,
      coalesce(d.entregues, 0)::bigint as entregues,
      coalesce(d.pontos_entregues, 0)::bigint as pontos_entregues
    from closed_by_team c
    full outer join delivered d
      on c.gitlab_milestone_iid = d.gitlab_milestone_iid
     and c.equipe = d.equipe
  )
  select
    x.gitlab_milestone_iid as milestone_iid,
    x.milestone_titulo,
    x.equipe,
    x.fechadas,
    x.entregues,
    x.pontos_entregues
  from combined x
  where x.fechadas > 0 or x.entregues > 0 or x.pontos_entregues > 0
  order by x.gitlab_milestone_iid asc, x.equipe asc;
$$;

comment on function public.report_milestone_capacity_by_team(integer, integer) is
  'Capacidade por equipe sprint a sprint: fechadas (issues.sprint + fechado) alinhadas ao KPI Sprint; entregues/pontos no intervalo da milestone.';

grant execute on function public._milestone_matches_issue_sprint(text, integer, text) to authenticated, service_role;
grant execute on function public.report_milestone_capacity_by_team(integer, integer) to authenticated, service_role;
