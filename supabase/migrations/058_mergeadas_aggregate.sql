-- =============================================================================
-- Migration 058 — Distribuição de mergeadas por parceria, tipo e prioridade
--
-- Conta issues com mergeado_em nos últimos 6 meses (mesma janela do pivô).
-- =============================================================================

create or replace function public.dashboard_mergeadas_aggregate(
  p_dimension text,
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
  label text,
  quantidade bigint
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
  merged as (
    select *
    from f
    where mergeado_em is not null
      and date_trunc('month', mergeado_em)
            >= date_trunc('month', current_date::timestamp) - interval '5 months'
  ),
  grouped as (
    select
      case p_dimension
        when 'parceria' then coalesce(nullif(trim(s.parceria), ''), 'Não informado')
        when 'tipo' then coalesce(nullif(trim(s.tipo), ''), 'Não informado')
        when 'prioridade' then coalesce(nullif(trim(s.prioridade), ''), 'Não informado')
        else 'Outros'
      end as lbl,
      count(*)::bigint as qty
    from merged s
    group by 1
  )
  select g.lbl as label, g.qty as quantidade
  from grouped g
  where g.qty > 0
  order by g.qty desc, g.lbl asc;
$$;

alter function public.dashboard_mergeadas_aggregate(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date
) security definer set search_path = public, pg_temp;

grant execute on function public.dashboard_mergeadas_aggregate(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date
) to anon, authenticated, service_role;
