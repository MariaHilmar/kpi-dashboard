-- =============================================================================
-- Migration 053 — Mergeadas por período e por épico (Executivo)
--
-- "Mergeada" = issue cujo merge foi feito no master (dev_mergeado = 'Sim').
-- A data do merge fica em issues.mergeado_em (merged_at do GitLab), mas o eixo
-- temporal pedido é o MÊS/ANO DE CRIAÇÃO da issue (ano_mes_criacao).
--
-- Ambas as RPCs partem de public._issues_filtered para respeitar os filtros
-- globais (inclusive módulo e o multi-tipo em CSV).
-- =============================================================================

-- --- Mergeadas por período (mês/ano de criação da issue) --------------------
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
    coalesce(nullif(trim(f.ano_mes_criacao), ''), 'Não informado') as periodo,
    f.ano_criacao as ano,
    extract(month from f.mes_criacao)::integer as mes,
    count(*)::bigint as total
  from f
  where lower(trim(f.dev_mergeado)) = 'sim'
  group by 1, 2, 3
  order by f.ano_criacao nulls last, mes nulls last;
$$;

grant execute on function public.dashboard_mergeadas_por_periodo(
  text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date
) to anon, authenticated, service_role;

-- --- Mergeadas por épico ----------------------------------------------------
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
  where lower(trim(f.dev_mergeado)) = 'sim'
  group by 1
  order by total desc, epico asc
  limit p_limit;
$$;

grant execute on function public.dashboard_mergeadas_por_epico(
  text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date, integer
) to anon, authenticated, service_role;
