-- =============================================================================
-- Migration 046 — KPIs de story points por recorte (sprint / filtros globais)
-- =============================================================================

create or replace function public.dashboard_story_points_kpis(
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
  p_criado_de date default null,
  p_criado_ate date default null,
  p_fechado_de date default null,
  p_fechado_ate date default null
)
returns table (
  pontos_abertos bigint,
  pontos_fechados bigint,
  issues_sem_pontos bigint
)
language sql
stable
as $$
  with f as (
    select * from public._issues_filtered(
      p_modulo, p_area, p_tipo, p_prioridade, p_equipe, p_status,
      p_parceria, p_sprint, p_epico, p_repositorio, p_situacao,
      p_ano, p_criado_de, p_criado_ate, p_fechado_de, p_fechado_ate
    )
  )
  select
    coalesce(sum(f.story_points) filter (where f.aberto is true), 0)::bigint as pontos_abertos,
    coalesce(sum(f.story_points) filter (where f.fechado is true), 0)::bigint as pontos_fechados,
    count(*) filter (where f.story_points is null)::bigint as issues_sem_pontos
  from f;
$$;

comment on function public.dashboard_story_points_kpis(
  text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date
) is
  'Soma story_points abertos/fechados no recorte filtrado — usado na página Sprint.';

grant execute on function public.dashboard_story_points_kpis(
  text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date
) to anon, authenticated, service_role;

alter function public.dashboard_story_points_kpis(
  text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date
) security definer set search_path = public, pg_temp;
