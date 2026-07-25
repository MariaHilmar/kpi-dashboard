-- =============================================================================
-- Migration 051 — Filtro de Tipo com multiplos valores
--
-- `p_tipo` passa a aceitar uma lista separada por virgula (ex.: "Bug,Melhoria").
-- Retrocompatível: um unico valor ("Bug") e "Todos"/NULL continuam funcionando.
-- Como _issues_filtered e a base de todas as RPCs, a mudanca se propaga para
-- todos os KPIs/graficos do dashboard sem alterar assinaturas.
-- =============================================================================

create or replace function public._issues_filtered(
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
returns setof public.issues
language sql
stable
as $$
  select i.*
  from public.issues i
  where (p_modulo is null or p_modulo = 'Todos'
         or (p_modulo = 'Não informado' and coalesce(trim(i.modulo), '') = '')
         or i.modulo = p_modulo)
    and (p_area is null or p_area = 'Todos'
         or (p_area = 'Não informado' and coalesce(trim(i.area_funcional), '') = '')
         or i.area_funcional = p_area)
    and (
      p_tipo is null or p_tipo = 'Todos'
      or exists (
        select 1
        from unnest(string_to_array(p_tipo, ',')) as t(v)
        where trim(t.v) = i.tipo
           or (trim(t.v) = 'Não informado' and coalesce(trim(i.tipo), '') = '')
      )
    )
    and (p_prioridade is null or p_prioridade = 'Todos'
         or (p_prioridade = 'Não informado' and coalesce(trim(i.prioridade), '') = '')
         or i.prioridade = p_prioridade)
    and (p_equipe is null or p_equipe = 'Todos'
         or (p_equipe = 'Não informado' and coalesce(trim(i.equipe), '') = '')
         or i.equipe = p_equipe)
    and (p_status is null or p_status = 'Todos'
         or (p_status = 'Não informado' and coalesce(trim(i.status), '') = '')
         or i.status = p_status)
    and (p_parceria is null or p_parceria = 'Todos'
         or (p_parceria = 'Não informado' and coalesce(trim(i.parceria), '') = '')
         or i.parceria = p_parceria)
    and (p_sprint is null or p_sprint = 'Todos'
         or (p_sprint = 'Não informado' and coalesce(trim(i.sprint), '') = '')
         or i.sprint = p_sprint)
    and (p_epico is null or p_epico = 'Todos'
         or (p_epico = 'Não informado' and coalesce(trim(i.epico), '') = '')
         or i.epico = p_epico)
    and (p_repositorio is null or p_repositorio = 'Todos'
         or (p_repositorio = 'Não informado' and coalesce(trim(i.repositorio), '') = '')
         or i.repositorio = p_repositorio)
    and (p_situacao is null or p_situacao = 'Todos'
         or (p_situacao = 'Não informado' and coalesce(trim(i.situacao_analise), '') = '')
         or i.situacao_analise = p_situacao)
    and (p_ano is null or p_ano = 0 or i.ano_criacao = p_ano)
    and (p_criado_de is null or i.criado_em >= p_criado_de)
    and (p_criado_ate is null or i.criado_em < (p_criado_ate + 1))
    and (p_fechado_de is null or i.fechado_em >= p_fechado_de)
    and (p_fechado_ate is null or i.fechado_em < (p_fechado_ate + 1));
$$;
