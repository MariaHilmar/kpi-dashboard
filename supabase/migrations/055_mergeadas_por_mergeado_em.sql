-- =============================================================================
-- Migration 055 — Mergeadas usam mergeado_em (merged_at do GitLab)
--
-- Problema: `dev_mergeado = 'Sim'` vinha do git local e subcontava (~502).
-- Fonte correta: issues.mergeado_em = maior merged_at dos MRs relacionados.
--
-- - Evolução mensal: coluna mergeadas por MÊS DO MERGE (mergeado_em)
-- - Pivot / por período / por épico: mesma definição (mergeado_em IS NOT NULL)
-- - Pivot: últimos 6 meses a partir da data atual (mês do merge)
-- =============================================================================

-- --- 1) Evolução mensal ------------------------------------------------------
drop function if exists public.dashboard_fluxo_mensal(
  text, text, text, text, text, text, text, text, text, text, text, integer
);

create or replace function public.dashboard_fluxo_mensal(
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
  p_ano integer default null
)
returns table (
  mes text,
  criados bigint,
  fechados bigint,
  backlog_liquido bigint,
  mergeadas bigint
)
language sql
stable
as $$
  with f as (
    select * from public._issues_filtered(
      p_modulo, p_area, p_tipo, p_prioridade, p_equipe, p_status,
      p_parceria, p_sprint, p_epico, p_repositorio, p_situacao,
      p_ano, null, null, null, null
    )
  ),
  meses as (
    select distinct to_char(date_trunc('month', criado_em), 'YYYY/MM') as mes
    from f
    where criado_em is not null
    union
    select distinct to_char(date_trunc('month', fechado_em), 'YYYY/MM')
    from f
    where fechado_em is not null
    union
    select distinct to_char(date_trunc('month', mergeado_em), 'YYYY/MM')
    from f
    where mergeado_em is not null
  ),
  agg as (
    select
      m.mes,
      (select count(*) from f where to_char(date_trunc('month', criado_em), 'YYYY/MM') = m.mes)::bigint as criados,
      (select count(*) from f where to_char(date_trunc('month', fechado_em), 'YYYY/MM') = m.mes)::bigint as fechados,
      (select count(*) from f where to_char(date_trunc('month', mergeado_em), 'YYYY/MM') = m.mes)::bigint as mergeadas
    from meses m
  )
  select
    a.mes,
    a.criados,
    a.fechados,
    sum(a.criados - a.fechados) over (order by a.mes rows between unbounded preceding and current row)::bigint as backlog_liquido,
    a.mergeadas
  from agg a
  order by a.mes;
$$;

grant execute on function public.dashboard_fluxo_mensal(
  text, text, text, text, text, text, text, text, text, text, text, integer
) to anon, authenticated, service_role;

-- --- 2) Mergeadas por período (mês do merge) --------------------------------
create or replace function public.dashboard_mergeadas_por_periodo(
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
  periodo text,
  ano integer,
  mes integer,
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
  )
  select
    to_char(date_trunc('month', f.mergeado_em), 'YYYY/MM') as periodo,
    extract(year from f.mergeado_em)::integer as ano,
    extract(month from f.mergeado_em)::integer as mes,
    count(*)::bigint as total
  from f
  where f.mergeado_em is not null
  group by 1, 2, 3
  order by ano nulls last, mes nulls last;
$$;

grant execute on function public.dashboard_mergeadas_por_periodo(
  text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date
) to anon, authenticated, service_role;

-- --- 3) Mergeadas por épico -------------------------------------------------
create or replace function public.dashboard_mergeadas_por_epico(
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
  p_fechado_ate date default null,
  p_limit integer default null
)
returns table (
  epico text,
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
  )
  select
    coalesce(nullif(trim(f.epico), ''), 'Não informado') as epico,
    count(*)::bigint as total
  from f
  where f.mergeado_em is not null
  group by 1
  order by total desc, epico asc
  limit p_limit;
$$;

grant execute on function public.dashboard_mergeadas_por_epico(
  text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date, integer
) to anon, authenticated, service_role;

-- --- 4) Pivot (módulo/épico × últimos 6 meses do merge) ---------------------
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
  base as (
    select
      case
        when coalesce(p_modulo, 'Todos') = 'Todos'
          then coalesce(nullif(trim(modulo), ''), 'Não informado')
        else coalesce(nullif(trim(epico), ''), 'Não informado')
      end as linha,
      to_char(date_trunc('month', mergeado_em), 'YYYY/MM') as periodo
    from f
    where mergeado_em is not null
      and date_trunc('month', mergeado_em) >= date_trunc('month', current_date) - interval '5 months'
  )
  select linha, periodo, count(*)::bigint as total
  from base
  group by 1, 2
  order by 1, 2;
$$;

grant execute on function public.dashboard_mergeadas_pivot(
  text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date
) to anon, authenticated, service_role;
