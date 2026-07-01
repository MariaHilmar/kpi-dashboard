-- =============================================================================
-- Migration 015 — Faixas de idade estendidas (121-180, 181-360, mais de um ano)
-- =============================================================================

create or replace function public.dashboard_faixa_idade()
returns table (
  faixa text,
  qtde bigint,
  percentual numeric
)
language sql
stable
as $$
  with base as (
    select case
      when public.issue_idade_atual(criado_em, aberto) is null then 'Sem dado'
      when public.issue_idade_atual(criado_em, aberto) <= 30 then '0-30 dias'
      when public.issue_idade_atual(criado_em, aberto) <= 60 then '31-60 dias'
      when public.issue_idade_atual(criado_em, aberto) <= 90 then '61-90 dias'
      when public.issue_idade_atual(criado_em, aberto) <= 120 then '91-120 dias'
      when public.issue_idade_atual(criado_em, aberto) <= 180 then '121-180 dias'
      when public.issue_idade_atual(criado_em, aberto) <= 360 then '181-360 dias'
      else 'Mais de 1 ano'
    end as faixa
    from public.issues
    where aberto is true
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

alter function public.dashboard_faixa_idade()
  security definer set search_path = public, pg_temp;

grant execute on function public.dashboard_faixa_idade()
  to anon, authenticated, service_role;
