-- =============================================================================
-- Migration 057 — Pivot mergeadas: universo completo de módulos/épicos
--
-- - Filtro módulo = Todos: todas as linhas = módulos (issues >= 2024), com zero.
-- - Filtro módulo específico: todas as linhas = épicos do módulo (prefixo
--   [Módulo] no título, catálogo gitlab_epics + issues), com zero.
-- - Contagens só atribuem épico quando o prefixo [Módulo] bate com o filtro.
-- =============================================================================

create or replace function public.dashboard_mergeadas_pivot(
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
  linha text,
  periodo text,
  total bigint
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
  ),
  periodos as (
    select to_char(d, 'YYYY/MM') as periodo
    from generate_series(
      date_trunc('month', current_date::timestamp) - interval '5 months',
      date_trunc('month', current_date::timestamp),
      interval '1 month'
    ) as d
  ),
  agg_modulo as (
    select
      coalesce(nullif(trim(f.modulo), ''), 'Não informado') as linha,
      to_char(date_trunc('month', f.mergeado_em), 'YYYY/MM') as periodo,
      count(*)::bigint as total
    from f
    where f.mergeado_em is not null
      and date_trunc('month', f.mergeado_em)
            >= date_trunc('month', current_date::timestamp) - interval '5 months'
    group by 1, 2
  ),
  agg_epico as (
    select
      coalesce(nullif(trim(f.epico), ''), 'Não informado') as linha,
      to_char(date_trunc('month', f.mergeado_em), 'YYYY/MM') as periodo,
      count(*)::bigint as total
    from f
    where f.mergeado_em is not null
      and date_trunc('month', f.mergeado_em)
            >= date_trunc('month', current_date::timestamp) - interval '5 months'
      and (
        coalesce(nullif(trim(f.epico), ''), 'Não informado') = 'Não informado'
        or substring(trim(f.epico) from '^\s*\[([^\]]+)\]') = p_modulo
      )
    group by 1, 2
  ),
  universe_modulos as (
    select distinct coalesce(nullif(trim(i.modulo), ''), 'Não informado') as linha
    from public.issues i
    where coalesce(i.ano_criacao, 0) >= 2024
  ),
  universe_epicos as (
    select distinct v.linha
    from (
      select nullif(trim(g.title), '') as linha
      from public.gitlab_epics g
      where nullif(trim(g.title), '') is not null
        and substring(trim(g.title) from '^\s*\[([^\]]+)\]') = p_modulo
      union
      select nullif(trim(i.epico), '') as linha
      from public.issues i
      where coalesce(i.ano_criacao, 0) >= 2024
        and (
          coalesce(nullif(trim(i.epico), ''), '') = ''
          or substring(trim(i.epico) from '^\s*\[([^\]]+)\]') = p_modulo
        )
    ) v
    where v.linha is not null
    union
    select 'Não informado'::text
    where exists (
      select 1
      from public.issues i
      where coalesce(i.ano_criacao, 0) >= 2024
        and i.modulo = p_modulo
        and coalesce(nullif(trim(i.epico), ''), '') = ''
    )
  ),
  universe as (
    select linha from universe_modulos
    where coalesce(p_modulo, 'Todos') = 'Todos'
    union
    select linha from universe_epicos
    where coalesce(p_modulo, 'Todos') <> 'Todos'
  ),
  agg as (
    select * from agg_modulo where coalesce(p_modulo, 'Todos') = 'Todos'
    union all
    select * from agg_epico where coalesce(p_modulo, 'Todos') <> 'Todos'
  )
  select
    u.linha,
    p.periodo,
    coalesce(a.total, 0)::bigint as total
  from universe u
  cross join periodos p
  left join agg a on a.linha = u.linha and a.periodo = p.periodo
  order by u.linha, p.periodo;
$$;

alter function public.dashboard_mergeadas_pivot(
  text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date
) security definer set search_path = public, pg_temp;

grant execute on function public.dashboard_mergeadas_pivot(
  text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date
) to anon, authenticated, service_role;
