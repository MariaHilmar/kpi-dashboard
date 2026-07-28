-- =============================================================================
-- Migration 068 — Alertas/Faixa/Lead times: aceitam p_mergeado_de / p_mergeado_ate
--
-- Contexto: a migration 059 adicionou o filtro de merge ao `_issues_filtered`
-- (assinatura de 18 args) e às RPCs do Executivo, mas as 4 RPCs da 018
-- (alertas_resumo, alertas_por_modulo, faixa_idade, top_lead_times) continuaram
-- com 16 parâmetros. O app passou a enviar `dateArgs` completo (incluindo
-- p_mergeado_de/ate) → PostgREST não encontrava a função (404) → tabelas de
-- Qualidade/Alertas apareciam vazias.
--
-- Aqui recriamos as 4 RPCs com os 18 parâmetros, repassando as datas de merge
-- ao `_issues_filtered` de 18 args (match exato, sem ambiguidade com a versão
-- antiga de 16 args). Comportamento inalterado quando não há filtro de merge.
-- =============================================================================

drop function if exists public.dashboard_alertas_resumo(
  text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date
);
drop function if exists public.dashboard_alertas_por_modulo(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date
);
drop function if exists public.dashboard_faixa_idade(
  text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date
);
drop function if exists public.dashboard_top_lead_times(
  integer, text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date
);

-- --- dashboard_alertas_resumo ------------------------------------------------
create or replace function public.dashboard_alertas_resumo(
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
  p_mergeado_de date default null,
  p_mergeado_ate date default null
)
returns table (
  abertas bigint,
  sem_epico bigint,
  sem_parceria bigint
)
language sql
stable
as $$
  with f as (
    select *
    from public._issues_filtered(
      p_modulo, p_area, p_tipo, p_prioridade, p_equipe, p_status,
      p_parceria, p_sprint, p_epico, p_repositorio, p_situacao,
      p_ano, p_criado_de, p_criado_ate, p_fechado_de, p_fechado_ate,
      p_mergeado_de, p_mergeado_ate
    )
  )
  select
    count(*) filter (where f.aberto is true)::bigint,
    count(*) filter (where f.aberto is true and coalesce(trim(f.epico), '') = '')::bigint,
    count(*) filter (where f.aberto is true and coalesce(trim(f.parceria), '') = '')::bigint
  from f;
$$;

-- --- dashboard_alertas_por_modulo --------------------------------------------
create or replace function public.dashboard_alertas_por_modulo(
  p_dimensao text,
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
  p_mergeado_de date default null,
  p_mergeado_ate date default null
)
returns table (
  modulo text,
  qtde bigint,
  percentual numeric
)
language sql
stable
as $$
  with f as (
    select *
    from public._issues_filtered(
      p_modulo, p_area, p_tipo, p_prioridade, p_equipe, p_status,
      p_parceria, p_sprint, p_epico, p_repositorio, p_situacao,
      p_ano, p_criado_de, p_criado_ate, p_fechado_de, p_fechado_ate,
      p_mergeado_de, p_mergeado_ate
    )
  ),
  base as (
    select coalesce(nullif(trim(f.modulo), ''), 'Outros') as modulo
    from f
    where f.aberto is true
      and (
        (p_dimensao = 'sem_epico' and coalesce(trim(f.epico), '') = '')
        or (p_dimensao = 'sem_parceria' and coalesce(trim(f.parceria), '') = '')
      )
  ),
  total as (select count(*)::numeric as t from base)
  select
    b.modulo,
    count(*)::bigint as qtde,
    case when (select t from total) > 0
         then round((count(*)::numeric / (select t from total)) * 100, 2)
         else 0 end as percentual
  from base b
  group by b.modulo
  order by qtde desc;
$$;

-- --- dashboard_faixa_idade ---------------------------------------------------
create or replace function public.dashboard_faixa_idade(
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
  p_mergeado_de date default null,
  p_mergeado_ate date default null
)
returns table (
  faixa text,
  qtde bigint,
  percentual numeric
)
language sql
stable
as $$
  with f as (
    select *
    from public._issues_filtered(
      p_modulo, p_area, p_tipo, p_prioridade, p_equipe, p_status,
      p_parceria, p_sprint, p_epico, p_repositorio, p_situacao,
      p_ano, p_criado_de, p_criado_ate, p_fechado_de, p_fechado_ate,
      p_mergeado_de, p_mergeado_ate
    )
  ),
  abertas as (
    select
      coalesce(
        public.issue_idade_atual(i.criado_em, i.aberto),
        case when i.aberto is true then i.idade_dias end
      ) as idade
    from f i
    where i.aberto is true
  ),
  base as (
    select case
      when idade is null then 'Sem dado'
      when idade <= 30 then '0-30 dias'
      when idade <= 60 then '31-60 dias'
      when idade <= 90 then '61-90 dias'
      when idade <= 120 then '91-120 dias'
      when idade <= 180 then '121-180 dias'
      when idade <= 360 then '181-360 dias'
      else 'Mais de 1 ano'
    end as faixa
    from abertas
  ),
  total as (select count(*)::numeric as t from base)
  select
    b.faixa,
    count(*)::bigint as qtde,
    case when (select t from total) > 0
         then round((count(*)::numeric / (select t from total)) * 100, 2)
         else 0 end as percentual
  from base b
  group by b.faixa
  order by
    case b.faixa
      when '0-30 dias' then 1
      when '31-60 dias' then 2
      when '61-90 dias' then 3
      when '91-120 dias' then 4
      when '121-180 dias' then 5
      when '181-360 dias' then 6
      when 'Mais de 1 ano' then 7
      else 8 end;
$$;

-- --- dashboard_top_lead_times ------------------------------------------------
create or replace function public.dashboard_top_lead_times(
  p_limit integer default 20,
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
  p_mergeado_de date default null,
  p_mergeado_ate date default null
)
returns table (
  id integer,
  titulo text,
  modulo text,
  area text,
  estado text,
  status text,
  prioridade text,
  equipe text,
  criado_em timestamptz,
  fechado_em timestamptz,
  lead_time integer
)
language sql
stable
as $$
  with f as (
    select *
    from public._issues_filtered(
      p_modulo, p_area, p_tipo, p_prioridade, p_equipe, p_status,
      p_parceria, p_sprint, p_epico, p_repositorio, p_situacao,
      p_ano, p_criado_de, p_criado_ate, p_fechado_de, p_fechado_ate,
      p_mergeado_de, p_mergeado_ate
    )
  )
  select
    f.gitlab_iid as id,
    f.titulo,
    coalesce(nullif(trim(f.modulo), ''), 'Não informado') as modulo,
    coalesce(nullif(trim(f.area_funcional), ''), '—') as area,
    f.estado,
    f.status,
    f.prioridade,
    f.equipe,
    f.criado_em,
    f.fechado_em,
    f.lead_time_dias as lead_time
  from f
  where f.lead_time_dias is not null
  order by f.lead_time_dias desc nulls last
  limit greatest(coalesce(p_limit, 20), 1);
$$;

-- --- security definer + grants -----------------------------------------------
alter function public.dashboard_alertas_resumo(
  text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date, date, date
) security definer set search_path = public, pg_temp;

alter function public.dashboard_alertas_por_modulo(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date, date, date
) security definer set search_path = public, pg_temp;

alter function public.dashboard_faixa_idade(
  text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date, date, date
) security definer set search_path = public, pg_temp;

alter function public.dashboard_top_lead_times(
  integer, text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date, date, date
) security definer set search_path = public, pg_temp;

grant execute on function public.dashboard_alertas_resumo(
  text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date, date, date
) to anon, authenticated, service_role;

grant execute on function public.dashboard_alertas_por_modulo(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date, date, date
) to anon, authenticated, service_role;

grant execute on function public.dashboard_faixa_idade(
  text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date, date, date
) to anon, authenticated, service_role;

grant execute on function public.dashboard_top_lead_times(
  integer, text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date, date, date
) to anon, authenticated, service_role;
