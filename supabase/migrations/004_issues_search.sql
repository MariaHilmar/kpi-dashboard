-- =============================================================================
-- Migration 004 — Busca de issues com filtros + paginação
-- =============================================================================

create or replace function public.search_issues(
  p_search text default null,
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
  p_estado text default null,
  p_sla text default null,
  p_order text default 'criado_em_desc',
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  total_count bigint,
  gitlab_iid integer,
  gitlab_repo text,
  titulo text,
  modulo text,
  area_funcional text,
  tipo text,
  estado text,
  status text,
  prioridade text,
  equipe text,
  parceria text,
  sprint text,
  epico text,
  desenvolvedor text,
  assignee text,
  criado_em timestamptz,
  fechado_em timestamptz,
  lead_time_dias integer,
  idade_dias integer,
  sla_mais_90_dias boolean
)
language plpgsql
stable
as $$
declare
  v_search_pattern text;
  v_search_id integer;
begin
  v_search_pattern := case
    when p_search is null or trim(p_search) = '' then null
    else '%' || trim(p_search) || '%'
  end;

  v_search_id := case
    when p_search ~ '^\d+$' then p_search::integer
    else null
  end;

  return query
  with filtered as (
    select i.*
    from public.issues i
    where coalesce(i.ano_criacao, 0) >= 2024
      and (p_modulo is null or p_modulo = 'Todos'
           or (p_modulo = 'Não informado' and coalesce(trim(i.modulo), '') = '')
           or i.modulo = p_modulo)
      and (p_area is null or p_area = 'Todos'
           or (p_area = 'Não informado' and coalesce(trim(i.area_funcional), '') = '')
           or i.area_funcional = p_area)
      and (p_tipo is null or p_tipo = 'Todos'
           or (p_tipo = 'Não informado' and coalesce(trim(i.tipo), '') = '')
           or i.tipo = p_tipo)
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
      and (p_estado is null or p_estado = 'Todos'
           or (p_estado = 'open' and i.aberto is true)
           or (p_estado = 'closed' and i.fechado is true))
      and (p_sla is null or p_sla = 'Todos'
           or (p_sla = 'acima_90' and i.sla_mais_90_dias is true))
      and (
        v_search_pattern is null
        or i.titulo ilike v_search_pattern
        or i.autor ilike v_search_pattern
        or i.assignee ilike v_search_pattern
        or i.desenvolvedor ilike v_search_pattern
        or (v_search_id is not null and i.gitlab_iid = v_search_id)
      )
  ),
  total_row as (select count(*)::bigint as total_count from filtered)
  select
    (select t.total_count from total_row t) as total_count,
    f.gitlab_iid,
    f.gitlab_repo,
    f.titulo,
    coalesce(nullif(trim(f.modulo), ''), 'Não informado') as modulo,
    coalesce(nullif(trim(f.area_funcional), ''), '—') as area_funcional,
    coalesce(nullif(trim(f.tipo), ''), 'Não informado') as tipo,
    f.estado,
    f.status,
    f.prioridade,
    f.equipe,
    f.parceria,
    f.sprint,
    f.epico,
    f.desenvolvedor,
    f.assignee,
    f.criado_em,
    f.fechado_em,
    f.lead_time_dias,
    f.idade_dias,
    f.sla_mais_90_dias
  from filtered f
  order by
    case when p_order = 'criado_em_desc' then f.criado_em end desc nulls last,
    case when p_order = 'criado_em_asc' then f.criado_em end asc nulls last,
    case when p_order = 'lead_time_desc' then f.lead_time_dias end desc nulls last,
    case when p_order = 'lead_time_asc' then f.lead_time_dias end asc nulls last,
    case when p_order = 'idade_desc' then f.idade_dias end desc nulls last,
    case when p_order = 'id_desc' then f.gitlab_iid end desc,
    case when p_order = 'id_asc' then f.gitlab_iid end asc
  limit greatest(coalesce(p_limit, 50), 1)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

grant execute on function public.search_issues(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, text, text, text, integer, integer
) to anon, authenticated, service_role;
