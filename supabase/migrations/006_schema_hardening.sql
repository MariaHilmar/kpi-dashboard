-- =============================================================================
-- Migration 006 — Endurecimento do schema (aditivo / não-destrutivo)
--
-- Objetivos:
--   (a) Tipar a confiança da área como número (coluna gerada, mantém a antiga).
--   (b) Calcular idade/SLA/faixa de idade NO BANCO (frescos), eliminando a
--       defasagem das colunas que vinham congeladas do Excel a cada sync.
--   (c) Remover objetos mortos substituídos pelas migrations 003/005.
--
-- Esta migration NÃO altera assinaturas de função nem remove colunas usadas,
-- então o app (mgi-kpi-dashboard) e o pipeline (sync_supabase.py) continuam
-- funcionando sem mudanças.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------

-- Conversão tolerante a falhas: "95%" -> 95, "" -> NULL, "Alta" -> NULL.
-- IMMUTABLE para poder ser usada em coluna GENERATED.
create or replace function public.safe_to_numeric(p_text text)
returns numeric
language plpgsql
immutable
as $$
begin
  return nullif(regexp_replace(coalesce(p_text, ''), '[^0-9.,-]', '', 'g'), '')::numeric;
exception when others then
  return null;
end;
$$;

-- Idade em dias SEMPRE atual (replica exatamente a fórmula do Excel:
--   abertas: max(hoje - criado, 0); fechadas: 0; sem data de criação: NULL).
-- STABLE porque depende de current_date.
create or replace function public.issue_idade_atual(
  p_criado_em timestamptz,
  p_aberto boolean
)
returns integer
language sql
stable
as $$
  select case
    when p_criado_em is null then null
    when p_aberto is true then greatest((current_date - p_criado_em::date), 0)
    else 0
  end;
$$;

-- SLA estourado (> 90 dias) calculado sobre a idade atual.
create or replace function public.issue_sla_90(
  p_criado_em timestamptz,
  p_aberto boolean
)
returns boolean
language sql
stable
as $$
  select p_aberto is true
     and p_criado_em is not null
     and (current_date - p_criado_em::date) > 90;
$$;

grant execute on function public.safe_to_numeric(text) to anon, authenticated, service_role;
grant execute on function public.issue_idade_atual(timestamptz, boolean) to anon, authenticated, service_role;
grant execute on function public.issue_sla_90(timestamptz, boolean) to anon, authenticated, service_role;


-- -----------------------------------------------------------------------------
-- (a) confiança da área como número (percentual 0–100), coluna gerada.
--     A coluna text `confianca_area` é mantida para compatibilidade.
-- -----------------------------------------------------------------------------
alter table public.issues
  add column if not exists confianca_area_pct numeric
  generated always as (public.safe_to_numeric(confianca_area)) stored;


-- -----------------------------------------------------------------------------
-- (b) KPIs com SLA fresco (substitui leitura da coluna congelada sla_mais_90_dias).
--     Mesma assinatura/colunas de retorno da migration 003.
-- -----------------------------------------------------------------------------
create or replace function public.dashboard_kpis_full(
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
  total bigint,
  abertas bigint,
  fechadas bigint,
  taxa_fechamento numeric,
  lead_time_medio numeric,
  bugs_abertos bigint,
  melhorias_abertas bigint,
  sem_tipo bigint,
  pct_bugs_backlog numeric,
  taxa_fech_bug numeric,
  sla_acima_90 bigint
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
  agg as (
    select
      count(*)::bigint as total,
      count(*) filter (where aberto is true)::bigint as abertas,
      count(*) filter (where fechado is true)::bigint as fechadas,
      round(avg(lead_time_dias) filter (where lead_time_dias is not null), 1) as lead_time_medio,
      count(*) filter (where tipo ilike 'bug' and aberto is true)::bigint as bugs_abertos,
      count(*) filter (where tipo ilike 'melhoria' and aberto is true)::bigint as melhorias_abertas,
      count(*) filter (where coalesce(trim(tipo), '') = '')::bigint as sem_tipo,
      count(*) filter (where tipo ilike 'bug')::bigint as total_bugs,
      count(*) filter (where tipo ilike 'bug' and fechado is true)::bigint as bugs_fechados,
      count(*) filter (where public.issue_sla_90(criado_em, aberto))::bigint as sla_acima_90
    from f
  )
  select
    a.total,
    a.abertas,
    a.fechadas,
    case when a.total > 0 then round((a.fechadas::numeric / a.total) * 100, 1) else 0 end as taxa_fechamento,
    a.lead_time_medio,
    a.bugs_abertos,
    a.melhorias_abertas,
    a.sem_tipo,
    case when a.abertas > 0 then round((a.bugs_abertos::numeric / a.abertas) * 100, 1) else 0 end as pct_bugs_backlog,
    case when a.total_bugs > 0 then round((a.bugs_fechados::numeric / a.total_bugs) * 100, 1) else 0 end as taxa_fech_bug,
    a.sla_acima_90
  from agg a;
$$;


-- -----------------------------------------------------------------------------
-- (b) Faixa de idade fresca (substitui leitura da coluna congelada idade_dias).
-- -----------------------------------------------------------------------------
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
      else 'Mais de 120 dias'
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
      when 'Mais de 120 dias' then 5
      else 6 end;
$$;


-- -----------------------------------------------------------------------------
-- (b) Busca de issues: idade e SLA frescos na listagem e no filtro de SLA.
--     Mesma assinatura/colunas de retorno da migration 004.
-- -----------------------------------------------------------------------------
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
           or (p_sla = 'acima_90' and public.issue_sla_90(i.criado_em, i.aberto)))
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
    public.issue_idade_atual(f.criado_em, f.aberto) as idade_dias,
    public.issue_sla_90(f.criado_em, f.aberto) as sla_mais_90_dias
  from filtered f
  order by
    case when p_order = 'criado_em_desc' then f.criado_em end desc nulls last,
    case when p_order = 'criado_em_asc' then f.criado_em end asc nulls last,
    case when p_order = 'lead_time_desc' then f.lead_time_dias end desc nulls last,
    case when p_order = 'lead_time_asc' then f.lead_time_dias end asc nulls last,
    case when p_order = 'idade_desc' then public.issue_idade_atual(f.criado_em, f.aberto) end desc nulls last,
    case when p_order = 'id_desc' then f.gitlab_iid end desc,
    case when p_order = 'id_asc' then f.gitlab_iid end asc
  limit greatest(coalesce(p_limit, 50), 1)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;


-- -----------------------------------------------------------------------------
-- (c) Remover objetos mortos (substituídos por *_v2 / *_full / v_filter_options_full).
--     Confirmado: não são referenciados pelo app (mgi-kpi-dashboard usa as novas).
-- -----------------------------------------------------------------------------
drop function if exists public.dashboard_aggregate(text, text, text, integer, integer);
drop function if exists public.dashboard_kpis(text, text, integer);
drop view if exists public.v_kpis;
drop view if exists public.v_filter_options;
