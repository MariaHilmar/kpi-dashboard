-- =============================================================================
-- Migration 071 - Módulo Conta Vinculada no filtro global
--
-- Opção fixa no select de módulo. Quando selecionada, restringe às issues cujo
-- título começa com [Conta Vinculada]. Os demais módulos continuam em i.modulo.
-- =============================================================================

create or replace function public.matches_modulo_filter(
  p_filter text,
  p_modulo text,
  p_titulo text
)
returns boolean
language sql
immutable
parallel safe
as $$
  select
    p_filter is null
    or btrim(p_filter) = ''
    or btrim(p_filter) = 'Todos'
    or (
      btrim(p_filter) = 'Não informado'
      and coalesce(btrim(p_modulo), '') = ''
    )
    or (
      btrim(p_filter) = 'Conta Vinculada'
      and ltrim(coalesce(p_titulo, '')) like '[Conta Vinculada]%'
    )
    or p_modulo = p_filter;
$$;

comment on function public.matches_modulo_filter(text, text, text) is
  'Filtro de módulo. Conta Vinculada casa o prefixo [Conta Vinculada] no título; os demais valores comparam a coluna modulo.';

grant execute on function public.matches_modulo_filter(text, text, text) to anon, authenticated, service_role;

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
  p_fechado_ate date default null,
  p_mergeado_de date default null,
  p_mergeado_ate date default null
)
returns setof public.issues
language sql
stable
as $$
  select i.*
  from public.issues i
  where public.matches_modulo_filter(p_modulo, i.modulo, i.titulo)
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
    and (
      p_status is null or p_status = 'Todos'
      or exists (
        select 1
        from unnest(string_to_array(p_status, ',')) as s(v)
        where trim(s.v) = i.status
           or (trim(s.v) = 'Não informado' and coalesce(trim(i.status), '') = '')
      )
    )
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
    and (p_fechado_ate is null or i.fechado_em < (p_fechado_ate + 1))
    and (p_mergeado_de is null or i.mergeado_em >= p_mergeado_de)
    and (p_mergeado_ate is null or i.mergeado_em < (p_mergeado_ate + 1));
$$;

-- search_issues: mesma regra de multi-status (listagem /issues)
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
      and public.matches_modulo_filter(p_modulo, i.modulo, i.titulo)
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
      and (
        p_status is null or p_status = 'Todos'
        or exists (
          select 1
          from unnest(string_to_array(p_status, ',')) as s(v)
          where trim(s.v) = i.status
             or (trim(s.v) = 'Não informado' and coalesce(trim(i.status), '') = '')
        )
      )
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

create or replace function public._flow_issues_filtered(
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
  p_assignee text default null,
  p_start_date date default null,
  p_end_date date default null,
  p_active_in_period boolean default false,
  p_only_abertas boolean default false
)
returns setof public.issues
language sql
stable
as $$
  select i.*
  from public.issues i
  where public.matches_modulo_filter(p_modulo, i.modulo, i.titulo)
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
         or i.repositorio = p_repositorio
         or i.gitlab_repo = p_repositorio)
    and (p_situacao is null or p_situacao = 'Todos'
         or (p_situacao = 'Não informado' and coalesce(trim(i.situacao_analise), '') = '')
         or i.situacao_analise = p_situacao)
    and (p_ano is null or p_ano = 0 or i.ano_criacao = p_ano)
    and (p_assignee is null or p_assignee = 'Todos'
         or coalesce(i.assignee, '') ilike '%' || p_assignee || '%'
         or coalesce(i.desenvolvedor, '') ilike '%' || p_assignee || '%'
         or coalesce(i.autor, '') ilike '%' || p_assignee || '%'
         or exists (
           select 1
           from public.issue_participants ip
           join public.gitlab_users gu on gu.id = ip.gitlab_user_id
           where ip.issue_key = i.issue_key
             and ip.role in ('assignee', 'developer')
             and (gu.name ilike '%' || p_assignee || '%'
                  or gu.username ilike '%' || p_assignee || '%')
         ))
    and (not p_active_in_period or (
      i.criado_em is not null
      and i.criado_em::date <= coalesce(p_end_date, current_date)
      and (i.fechado_em is null or i.fechado_em::date >= coalesce(p_start_date, i.criado_em::date))
    ))
    and (not p_only_abertas or i.aberto is true);
$$;

drop function if exists public.analista_relatorio_snapshot(text, text, text, text, bigint);

create or replace function public.analista_relatorio_snapshot(
  p_ano_mes text,
  p_sprint text default null,
  p_modulo text default null,
  p_autor text default null,
  p_gitlab_user_id bigint default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_ano_mes text;
  v_sprint text;
  v_modulo text;
  v_autor text;
  v_result jsonb;
begin
  v_ano_mes := replace(trim(coalesce(p_ano_mes, '')), '-', '/');
  v_sprint := nullif(trim(coalesce(p_sprint, '')), '');
  if v_sprint = 'Todos' then
    v_sprint := null;
  end if;
  v_modulo := nullif(trim(coalesce(p_modulo, '')), '');
  if v_modulo = 'Todos' then
    v_modulo := null;
  end if;
  v_autor := nullif(trim(coalesce(p_autor, '')), '');
  if v_autor = 'Todos' then
    v_autor := null;
  end if;

  with base as (
    select i.*
    from public.issues i
    where coalesce(i.ano_criacao, 0) >= 2024
      and (v_ano_mes is null or v_ano_mes = '' or i.ano_mes_criacao = v_ano_mes)
      and (
        v_sprint is null
        or (v_sprint = 'Não informado' and coalesce(trim(i.sprint), '') = '')
        or i.sprint = v_sprint
      )
      and public.matches_modulo_filter(v_modulo, i.modulo, i.titulo)
      and (
        case
          when p_gitlab_user_id is not null then
            i.gitlab_author_id = p_gitlab_user_id
            or exists (
              select 1
              from public.issue_participants ip
              where ip.issue_key = i.issue_key
                and ip.role = 'author'
                and ip.gitlab_user_id = p_gitlab_user_id
            )
          else
            v_autor is null
            or (v_autor = 'Não informado' and coalesce(trim(i.autor), '') = '')
            or lower(trim(i.autor)) = lower(v_autor)
        end
      )
  ),
  kpi as (
    select
      count(*)::bigint as total,
      count(*) filter (where aberto is true)::bigint as abertas,
      count(*) filter (where fechado is true)::bigint as fechadas,
      count(*) filter (
        where coalesce(i.estado, '') ilike '%cancel%'
           or coalesce(i.status, '') ilike '%cancel%'
      )::bigint as canceladas,
      count(*) filter (
        where coalesce(i.status, '') ilike '%delivered%'
      )::bigint as entregues,
      count(*) filter (
        where coalesce(i.status, '') ilike '%doing%'
      )::bigint as doing,
      coalesce(
        v_sprint,
        (
          select b2.sprint
          from base b2
          where coalesce(trim(b2.sprint), '') <> ''
          group by b2.sprint
          order by count(*) desc, b2.sprint
          limit 1
        )
      ) as sprint_atual
    from base i
  ),
  por_tipo as (
    select
      coalesce(nullif(trim(b.tipo), ''), 'Não informado') as label,
      count(*)::bigint as total,
      count(*) filter (where b.aberto is true)::bigint as abertas,
      count(*) filter (where b.fechado is true)::bigint as fechadas,
      case
        when count(*) > 0 then round((count(*) filter (where b.fechado is true)::numeric / count(*)) * 100)
        else 0
      end as pct_conclusao
    from base b
    group by 1
    order by 1
  ),
  por_modulo as (
    select
      coalesce(nullif(trim(b.modulo), ''), 'Não informado') as label,
      count(*)::bigint as total,
      count(*) filter (where b.aberto is true)::bigint as abertas,
      count(*) filter (where b.fechado is true)::bigint as fechadas,
      case
        when count(*) > 0 then round((count(*) filter (where b.fechado is true)::numeric / count(*)) * 100)
        else 0
      end as pct_conclusao
    from base b
    group by 1
    order by 1
  ),
  por_parceiro as (
    select
      coalesce(nullif(trim(b.parceria), ''), 'Sem Parceiro') as label,
      count(*)::bigint as total,
      count(*) filter (where b.aberto is true)::bigint as abertas,
      count(*) filter (where b.fechado is true)::bigint as fechadas,
      case
        when count(*) > 0 then round((count(*) filter (where b.fechado is true)::numeric / count(*)) * 100)
        else 0
      end as pct_conclusao
    from base b
    group by 1
    order by 1
  ),
  issues as (
    select
      b.gitlab_iid,
      b.gitlab_repo,
      b.titulo,
      coalesce(nullif(trim(b.modulo), ''), 'Não informado') as modulo,
      coalesce(nullif(trim(b.tipo), ''), 'Não informado') as tipo,
      coalesce(nullif(trim(b.desenvolvedor), ''), nullif(trim(b.assignee), ''), '—') as colaborador,
      case when b.aberto is true then 'Aberta' else 'Fechada' end as status,
      coalesce(nullif(trim(b.status), ''), 'Sem Status') as status_label,
      coalesce(nullif(trim(b.parceria), ''), 'Sem Parceiro') as parceiro,
      coalesce(nullif(trim(b.epico), ''), 'Não informado') as epico,
      coalesce(nullif(trim(b.sprint), ''), 'Sem Sprint') as sprint,
      b.criado_em,
      case
        when b.gitlab_iid is not null and coalesce(trim(b.gitlab_repo), '') <> '' then
          'https://gitlab.com/comprasnet/' || trim(b.gitlab_repo) || '/-/work_items/' || b.gitlab_iid::text
        else null
      end as url
    from base b
    order by b.gitlab_iid desc nulls last
  )
  select jsonb_build_object(
    'kpis', (select to_jsonb(k.*) from kpi k),
    'por_tipo', coalesce((select jsonb_agg(to_jsonb(t.*) order by t.label) from por_tipo t), '[]'::jsonb),
    'por_modulo', coalesce((select jsonb_agg(to_jsonb(m.*) order by m.label) from por_modulo m), '[]'::jsonb),
    'por_parceiro', coalesce((select jsonb_agg(to_jsonb(p.*) order by p.label) from por_parceiro p), '[]'::jsonb),
    'issues', coalesce((select jsonb_agg(to_jsonb(i.*) order by i.gitlab_iid desc) from issues i), '[]'::jsonb)
  )
  into v_result;

  return coalesce(v_result, '{}'::jsonb);
end;
$$;

grant execute on function public.analista_relatorio_snapshot(text, text, text, text, bigint)
  to anon, authenticated, service_role;

-- Opção fixa na lista de módulos do filtro global.
create or replace view public.v_filter_options_full as
select
  array(
    select distinct v
    from (
      select coalesce(nullif(trim(modulo), ''), 'Não informado') as v
      from public.issues
      where coalesce(ano_criacao, 0) >= 2024
      union
      select 'Conta Vinculada'::text
    ) modulo_opts
    where v is not null
    order by 1
  ) as modulos,
  array(select distinct coalesce(nullif(trim(area_funcional), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as areas,
  array(
    select distinct v
    from (
      select coalesce(nullif(trim(tipo), ''), 'Não informado') as v
      from public.issues
      where coalesce(ano_criacao, 0) >= 2024
      union
      select nullif(trim(tipo), '') as v
      from public.gitlab_tipo_labels
      where nullif(trim(tipo), '') is not null
    ) tipo_opts
    where v is not null
    order by 1
  ) as tipos,
  array(select distinct coalesce(nullif(trim(prioridade), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as prioridades,
  array(select distinct coalesce(nullif(trim(equipe), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as equipes,
  array(select distinct coalesce(nullif(trim(status), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as statuses,
  array(select distinct coalesce(nullif(trim(parceria), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as parcerias,
  array(select distinct coalesce(nullif(trim(sprint), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as sprints,
  array(
    select distinct v
    from (
      select coalesce(nullif(trim(epico), ''), 'Não informado') as v
      from public.issues
      where coalesce(ano_criacao, 0) >= 2024
      union
      select nullif(trim(title), '') as v
      from public.gitlab_epics
      where coalesce(nullif(trim(state), ''), 'opened') = 'opened'
        and nullif(trim(title), '') is not null
    ) epico_opts
    where v is not null
    order by 1
  ) as epicos,
  array(select distinct coalesce(nullif(trim(repositorio), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as repositorios,
  array(select distinct ano_criacao from public.issues where ano_criacao is not null order by 1 desc) as anos,
  array(select distinct coalesce(nullif(trim(autor), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as autores,
  (
    select coalesce(
      jsonb_object_agg(modulo, areas order by modulo),
      '{}'::jsonb
    )
    from (
      select
        coalesce(nullif(trim(modulo), ''), 'Não informado') as modulo,
        array_agg(
          distinct coalesce(nullif(trim(area_funcional), ''), 'Não informado')
          order by coalesce(nullif(trim(area_funcional), ''), 'Não informado')
        ) as areas
      from public.issues
      where coalesce(ano_criacao, 0) >= 2024
      group by 1
    ) grouped
  ) as areas_por_modulo;

grant select on public.v_filter_options_full to anon, authenticated, service_role;
