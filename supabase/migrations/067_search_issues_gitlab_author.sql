-- =============================================================================
-- Migration 067 — search_issues: filtro por autor via gitlab_user_id
--
-- Espelha o matcher do snapshot de Analistas (`analista_relatorio_snapshot`):
-- gitlab_author_id direto OU participação com role 'author'. Permite que os
-- drill-downs do painel /analistas reproduzam exatamente o recorte por autor,
-- já que `issues.autor` (texto) diverge do nome de exibição do perfil.
-- =============================================================================

drop function if exists public.search_issues(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, text, text, text, text, date, date, date, date, date, date, boolean, text, integer, integer
);

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
  p_faixa_idade text default null,
  p_autor text default null,
  p_criado_de date default null,
  p_criado_ate date default null,
  p_fechado_de date default null,
  p_fechado_ate date default null,
  p_mergeado_de date default null,
  p_mergeado_ate date default null,
  p_exige_parceria boolean default false,
  p_order text default 'criado_em_desc',
  p_limit integer default 50,
  p_offset integer default 0,
  p_gitlab_author_id bigint default null
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
  entrega_prevista date,
  lead_time_dias integer,
  idade_dias integer,
  sla_mais_90_dias boolean,
  story_points integer,
  aceita text,
  justificada text,
  historico text,
  recorrente text,
  horas_estimada numeric,
  horas_prevista numeric,
  homologado text
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
      and (p_autor is null or p_autor = 'Todos'
           or (p_autor = 'Não informado' and coalesce(trim(i.autor), '') = '')
           or i.autor = p_autor)
      and (
        p_gitlab_author_id is null
        or i.gitlab_author_id = p_gitlab_author_id
        or exists (
          select 1
          from public.issue_participants ip
          where ip.issue_key = i.issue_key
            and ip.role = 'author'
            and ip.gitlab_user_id = p_gitlab_author_id
        )
      )
      and (p_criado_de is null or i.criado_em >= p_criado_de)
      and (p_criado_ate is null or i.criado_em < (p_criado_ate + 1))
      and (p_fechado_de is null or i.fechado_em >= p_fechado_de)
      and (p_fechado_ate is null or i.fechado_em < (p_fechado_ate + 1))
      and (p_mergeado_de is null or i.mergeado_em >= p_mergeado_de)
      and (p_mergeado_ate is null or i.mergeado_em < (p_mergeado_ate + 1))
      and (not coalesce(p_exige_parceria, false) or coalesce(trim(i.parceria), '') <> '')
      and (p_estado is null or p_estado = 'Todos'
           or (p_estado = 'open' and i.aberto is true)
           or (p_estado = 'closed' and i.fechado is true))
      and (p_sla is null or p_sla = 'Todos'
           or (p_sla = 'acima_90' and public.issue_sla_90(i.criado_em, i.aberto)))
      and (p_faixa_idade is null or p_faixa_idade = 'Todos'
           or (
             case
               when coalesce(
                 public.issue_idade_atual(i.criado_em, i.aberto),
                 case when i.aberto is true then i.idade_dias end
               ) is null then 'Sem dado'
               when coalesce(
                 public.issue_idade_atual(i.criado_em, i.aberto),
                 case when i.aberto is true then i.idade_dias end
               ) <= 30 then '0-30 dias'
               when coalesce(
                 public.issue_idade_atual(i.criado_em, i.aberto),
                 case when i.aberto is true then i.idade_dias end
               ) <= 60 then '31-60 dias'
               when coalesce(
                 public.issue_idade_atual(i.criado_em, i.aberto),
                 case when i.aberto is true then i.idade_dias end
               ) <= 90 then '61-90 dias'
               when coalesce(
                 public.issue_idade_atual(i.criado_em, i.aberto),
                 case when i.aberto is true then i.idade_dias end
               ) <= 120 then '91-120 dias'
               when coalesce(
                 public.issue_idade_atual(i.criado_em, i.aberto),
                 case when i.aberto is true then i.idade_dias end
               ) <= 180 then '121-180 dias'
               when coalesce(
                 public.issue_idade_atual(i.criado_em, i.aberto),
                 case when i.aberto is true then i.idade_dias end
               ) <= 360 then '181-360 dias'
               else 'Mais de 1 ano'
             end = p_faixa_idade
           ))
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
    f.entrega_prevista,
    f.lead_time_dias,
    public.issue_idade_atual(f.criado_em, f.aberto) as idade_dias,
    public.issue_sla_90(f.criado_em, f.aberto) as sla_mais_90_dias,
    f.story_points,
    f.aceita,
    f.justificada,
    f.historico,
    f.recorrente,
    f.horas_estimada,
    f.horas_prevista,
    f.homologado
  from filtered f
  order by
    case when p_order = 'id_asc' then f.gitlab_iid end asc,
    case when p_order = 'id_desc' then f.gitlab_iid end desc,
    case when p_order = 'titulo_asc' then f.titulo end asc nulls last,
    case when p_order = 'titulo_desc' then f.titulo end desc nulls last,
    case when p_order = 'modulo_asc' then coalesce(nullif(trim(f.modulo), ''), 'Não informado') end asc nulls last,
    case when p_order = 'modulo_desc' then coalesce(nullif(trim(f.modulo), ''), 'Não informado') end desc nulls last,
    case when p_order = 'tipo_asc' then coalesce(nullif(trim(f.tipo), ''), 'Não informado') end asc nulls last,
    case when p_order = 'tipo_desc' then coalesce(nullif(trim(f.tipo), ''), 'Não informado') end desc nulls last,
    case when p_order = 'estado_asc' then f.estado end asc nulls last,
    case when p_order = 'estado_desc' then f.estado end desc nulls last,
    case when p_order = 'status_asc' then coalesce(nullif(trim(f.status), ''), case when f.aberto is true then 'Aberta' else 'Fechada' end) end asc nulls last,
    case when p_order = 'status_desc' then coalesce(nullif(trim(f.status), ''), case when f.aberto is true then 'Aberta' else 'Fechada' end) end desc nulls last,
    case when p_order = 'prioridade_asc' then f.prioridade end asc nulls last,
    case when p_order = 'prioridade_desc' then f.prioridade end desc nulls last,
    case when p_order = 'equipe_asc' then f.equipe end asc nulls last,
    case when p_order = 'equipe_desc' then f.equipe end desc nulls last,
    case when p_order = 'parceria_asc' then coalesce(nullif(trim(f.parceria), ''), 'Não informado') end asc nulls last,
    case when p_order = 'parceria_desc' then coalesce(nullif(trim(f.parceria), ''), 'Não informado') end desc nulls last,
    case when p_order = 'criado_em_asc' then f.criado_em end asc nulls last,
    case when p_order = 'criado_em_desc' then f.criado_em end desc nulls last,
    case when p_order = 'entrega_prevista_asc' then f.entrega_prevista end asc nulls last,
    case when p_order = 'entrega_prevista_desc' then f.entrega_prevista end desc nulls last,
    case when p_order = 'fechado_em_asc' then f.fechado_em end asc nulls last,
    case when p_order = 'fechado_em_desc' then f.fechado_em end desc nulls last,
    case when p_order = 'lead_time_asc' then f.lead_time_dias end asc nulls last,
    case when p_order = 'lead_time_desc' then f.lead_time_dias end desc nulls last,
    case when p_order = 'idade_asc' then public.issue_idade_atual(f.criado_em, f.aberto) end asc nulls last,
    case when p_order = 'idade_desc' then public.issue_idade_atual(f.criado_em, f.aberto) end desc nulls last,
    case when p_order = 'story_points_asc' then f.story_points end asc nulls last,
    case when p_order = 'story_points_desc' then f.story_points end desc nulls last,
    f.fechado_em desc nulls last,
    f.gitlab_iid desc nulls last
  limit greatest(coalesce(p_limit, 50), 1)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

comment on function public.search_issues(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, text, text, text, text, date, date, date, date, date, date, boolean, text, integer, integer, bigint
) is
  'Lista paginada de issues com filtros globais, merge/fechamento, autor por gitlab_user_id e campos Planning Poker.';

grant execute on function public.search_issues(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, text, text, text, text, date, date, date, date, date, date, boolean, text, integer, integer, bigint
) to anon, authenticated, service_role;

alter function public.search_issues(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, text, text, text, text, date, date, date, date, date, date, boolean, text, integer, integer, bigint
) security definer set search_path = public, pg_temp;
