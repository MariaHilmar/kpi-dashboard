-- =============================================================================
-- schema.sql (gerado automaticamente)
-- Gerado em: 2026-07-02 01:48:15 UTC
-- Fonte: concatenacao ordenada de supabase/migrations/*.sql
--
-- IMPORTANTE: apos criar/editar uma migration, regenere com:
--   python supabase/generate_schema.py
-- Preferencialmente com DATABASE_URL no .env para dump fiel do banco.
-- =============================================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;


-- -----------------------------------------------------------------------------
-- migration: 001_initial_schema.sql
-- -----------------------------------------------------------------------------

-- MGI Dashboard Web — schema inicial (aba Dados + agregações)

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Issues (espelho da aba Dados)
-- ---------------------------------------------------------------------------
create table if not exists public.issues (
  id uuid primary key default gen_random_uuid(),
  issue_key text not null unique,
  gitlab_repo text not null default 'contratos_v2',
  gitlab_iid integer,
  titulo text,
  modulo text,
  modulo_normalizado text,
  area_funcional text,
  tipo text,
  estado text,
  status text,
  prioridade text,
  equipe text,
  parceria text,
  sprint text,
  assignee text,
  autor text,
  solicitante text,
  alteracao_escopo text,
  repositorio text,
  desenvolvedor text,
  criado_em timestamptz,
  fechado_em timestamptz,
  lead_time_dias integer,
  ano_mes_criacao text,
  ano_criacao integer,
  mes_criacao date,
  ano_mes_fechamento text,
  mes_fechamento date,
  aberto boolean,
  fechado boolean,
  idade_dias integer,
  sla_mais_90_dias boolean,
  dev_tem_branch text,
  dev_branch text,
  dev_commits integer,
  dev_ultimo_commit timestamptz,
  dev_autor_dev text,
  gitlab_mrs integer,
  dev_mergeado text,
  categoria text,
  modulo_ok text,
  area_ok text,
  padrao_titulo text,
  padrao_completo text,
  confianca_area text,
  situacao_analise text,
  desenvolvedor_futuro text,
  observacao_geral text,
  chamado text,
  priorizar text,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_issues_parceria on public.issues (parceria);
create index if not exists idx_issues_sprint on public.issues (sprint);
create index if not exists idx_issues_ano_criacao on public.issues (ano_criacao);
create index if not exists idx_issues_modulo on public.issues (modulo);
create index if not exists idx_issues_area on public.issues (area_funcional);
create index if not exists idx_issues_repositorio on public.issues (repositorio);
create index if not exists idx_issues_desenvolvedor on public.issues (desenvolvedor);
create index if not exists idx_issues_dev_mergeado on public.issues (dev_mergeado);

-- ---------------------------------------------------------------------------
-- Releases Git
-- ---------------------------------------------------------------------------
create table if not exists public.releases (
  id uuid primary key default gen_random_uuid(),
  repositorio text not null,
  versao text not null,
  data_release date,
  rotulo text,
  synced_at timestamptz not null default now(),
  unique (repositorio, versao)
);

-- ---------------------------------------------------------------------------
-- Metadados de sync
-- ---------------------------------------------------------------------------
create table if not exists public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'excel',
  rows_upserted integer not null default 0,
  releases_upserted integer not null default 0,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running',
  message text
);

-- ---------------------------------------------------------------------------
-- Views auxiliares (sem filtro — filtros aplicados no app ou via RPC)
-- ---------------------------------------------------------------------------
create or replace view public.v_filter_options as
select
  coalesce(nullif(trim(parceria), ''), 'Não informado') as parceria,
  coalesce(nullif(trim(sprint), ''), 'Não informado') as sprint,
  ano_criacao
from public.issues
where ano_criacao is not null;

-- KPIs consolidados
create or replace view public.v_kpis as
select
  count(*)::bigint as total_issues,
  count(*) filter (where aberto is true)::bigint as abertas,
  count(*) filter (where fechado is true)::bigint as fechadas,
  count(*) filter (where sla_mais_90_dias is true)::bigint as sla_acima_90,
  round(avg(lead_time_dias) filter (where lead_time_dias is not null), 1) as lead_time_medio
from public.issues
where coalesce(ano_criacao, 0) >= 2024;

-- ---------------------------------------------------------------------------
-- RPC: agregações com filtros (Parceria / Sprint / Ano)
-- ---------------------------------------------------------------------------
create or replace function public.dashboard_aggregate(
  p_dimension text,
  p_parceria text default null,
  p_sprint text default null,
  p_ano integer default null,
  p_limit integer default null
)
returns table (
  label text,
  quantidade bigint
)
language sql
stable
as $$
  with filtered as (
    select *
    from public.issues i
    where coalesce(i.ano_criacao, 0) >= 2024
      and (
        p_parceria is null
        or p_parceria = 'Todos'
        or (p_parceria = 'Não informado' and coalesce(trim(i.parceria), '') = '')
        or i.parceria = p_parceria
      )
      and (
        p_sprint is null
        or p_sprint = 'Todos'
        or (p_sprint = 'Não informado' and coalesce(trim(i.sprint), '') = '')
        or i.sprint = p_sprint
      )
      and (p_ano is null or p_ano = 0 or i.ano_criacao = p_ano)
  ),
  grouped as (
    select
      case p_dimension
        when 'parceria' then coalesce(nullif(trim(f.parceria), ''), 'Não informado')
        when 'repositorio' then coalesce(nullif(trim(f.repositorio), ''), 'Não informado')
        when 'area_funcional' then coalesce(nullif(trim(f.area_funcional), ''), 'Não informado')
        when 'desenvolvedor' then coalesce(nullif(trim(f.desenvolvedor), ''), 'Não informado')
        when 'dev_mergeado' then coalesce(nullif(trim(f.dev_mergeado), ''), 'Não informado')
        when 'modulo' then coalesce(nullif(trim(f.modulo), ''), 'Não informado')
        when 'tipo' then coalesce(nullif(trim(f.tipo), ''), 'Não informado')
        when 'prioridade' then coalesce(nullif(trim(f.prioridade), ''), 'Não informado')
        when 'qualidade_modulo_ok' then coalesce(nullif(trim(f.modulo_ok), ''), 'Não informado')
        when 'qualidade_area_ok' then coalesce(nullif(trim(f.area_ok), ''), 'Não informado')
        when 'qualidade_padrao_titulo' then coalesce(nullif(trim(f.padrao_titulo), ''), 'Não informado')
        when 'qualidade_padrao_completo' then coalesce(nullif(trim(f.padrao_completo), ''), 'Não informado')
        when 'categoria' then coalesce(nullif(trim(f.categoria), ''), 'Sem categoria')
        else 'Outros'
      end as lbl,
      count(*)::bigint as qty
    from filtered f
    group by 1
  )
  select g.lbl as label, g.qty as quantidade
  from grouped g
  order by g.qty desc, g.lbl asc
  limit case when p_limit is null or p_limit <= 0 then null else p_limit end;
$$;

create or replace function public.dashboard_kpis(
  p_parceria text default null,
  p_sprint text default null,
  p_ano integer default null
)
returns table (
  total_issues bigint,
  abertas bigint,
  fechadas bigint,
  sla_acima_90 bigint,
  lead_time_medio numeric
)
language sql
stable
as $$
  select
    count(*)::bigint,
    count(*) filter (where aberto is true)::bigint,
    count(*) filter (where fechado is true)::bigint,
    count(*) filter (where sla_mais_90_dias is true)::bigint,
    round(avg(lead_time_dias) filter (where lead_time_dias is not null), 1)
  from public.issues i
  where coalesce(i.ano_criacao, 0) >= 2024
    and (
      p_parceria is null or p_parceria = 'Todos'
      or (p_parceria = 'Não informado' and coalesce(trim(i.parceria), '') = '')
      or i.parceria = p_parceria
    )
    and (
      p_sprint is null or p_sprint = 'Todos'
      or (p_sprint = 'Não informado' and coalesce(trim(i.sprint), '') = '')
      or i.sprint = p_sprint
    )
    and (p_ano is null or p_ano = 0 or i.ano_criacao = p_ano);
$$;

-- ---------------------------------------------------------------------------
-- RLS (leitura pública anon por enquanto — ajustar com Auth depois)
-- ---------------------------------------------------------------------------
alter table public.issues enable row level security;
alter table public.releases enable row level security;
alter table public.sync_runs enable row level security;

create policy "issues_select_anon"
  on public.issues for select
  to anon, authenticated
  using (true);

create policy "releases_select_anon"
  on public.releases for select
  to anon, authenticated
  using (true);

create policy "sync_runs_select_anon"
  on public.sync_runs for select
  to anon, authenticated
  using (true);

-- Service role bypasses RLS, mas precisa de GRANT nas tabelas
grant usage on schema public to anon, authenticated, service_role;

grant select on public.issues to anon, authenticated;
grant select on public.releases to anon, authenticated;
grant select on public.sync_runs to anon, authenticated;

grant select, insert, update, delete on public.issues to service_role;
grant select, insert, update, delete on public.releases to service_role;
grant select, insert, update on public.sync_runs to service_role;

grant execute on function public.dashboard_aggregate(text, text, text, integer, integer) to anon, authenticated, service_role;
grant execute on function public.dashboard_kpis(text, text, integer) to anon, authenticated, service_role;

-- Service role faz upsert via pipeline Python (bypass RLS)


-- -----------------------------------------------------------------------------
-- migration: 002_grants.sql
-- -----------------------------------------------------------------------------

-- Grants para service_role (pipeline Python) e anon (dashboard read-only)

grant usage on schema public to anon, authenticated, service_role;

grant select on public.issues to anon, authenticated;
grant select on public.releases to anon, authenticated;
grant select on public.sync_runs to anon, authenticated;

grant select, insert, update, delete on public.issues to service_role;
grant select, insert, update, delete on public.releases to service_role;
grant select, insert, update on public.sync_runs to service_role;

grant execute on function public.dashboard_aggregate(text, text, text, integer, integer) to anon, authenticated, service_role;
grant execute on function public.dashboard_kpis(text, text, integer) to anon, authenticated, service_role;


-- -----------------------------------------------------------------------------
-- migration: 003_kpis_completos.sql
-- -----------------------------------------------------------------------------

-- =============================================================================
-- Migration 003 — KPIs completos do Dashboard Executivo (paridade com Excel)
-- =============================================================================

-- Garantir colunas que podem faltar (sync atualizado já as envia)
alter table public.issues
  add column if not exists epico text,
  add column if not exists faixa_idade text;

create index if not exists idx_issues_tipo on public.issues (tipo);
create index if not exists idx_issues_equipe on public.issues (equipe);
create index if not exists idx_issues_status on public.issues (status);
create index if not exists idx_issues_prioridade on public.issues (prioridade);
create index if not exists idx_issues_epico on public.issues (epico);

-- =============================================================================
-- Helpers internos: filtros padronizados (todos opcionais)
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
    and (p_criado_de is null or i.criado_em >= p_criado_de)
    and (p_criado_ate is null or i.criado_em < (p_criado_ate + 1))
    and (p_fechado_de is null or i.fechado_em >= p_fechado_de)
    and (p_fechado_ate is null or i.fechado_em < (p_fechado_ate + 1));
$$;

-- =============================================================================
-- KPIs completos (10 cartões do Excel)
-- =============================================================================
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
      count(*) filter (where sla_mais_90_dias is true)::bigint as sla_acima_90
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

-- =============================================================================
-- Agregação genérica multi-dimensão (substitui dashboard_aggregate antiga)
-- =============================================================================
create or replace function public.dashboard_aggregate_v2(
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
  p_fechado_ate date default null,
  p_limit integer default null,
  p_only_abertas boolean default false
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
  scoped as (
    select * from f
    where (not p_only_abertas) or (aberto is true)
  ),
  grouped as (
    select
      case p_dimension
        when 'parceria' then coalesce(nullif(trim(s.parceria), ''), 'Não informado')
        when 'repositorio' then coalesce(nullif(trim(s.repositorio), ''), 'Não informado')
        when 'area_funcional' then coalesce(nullif(trim(s.area_funcional), ''), 'Não informado')
        when 'desenvolvedor' then coalesce(nullif(trim(s.desenvolvedor), ''), 'Não informado')
        when 'dev_mergeado' then coalesce(nullif(trim(s.dev_mergeado), ''), 'Não informado')
        when 'modulo' then coalesce(nullif(trim(s.modulo), ''), 'Não informado')
        when 'tipo' then coalesce(nullif(trim(s.tipo), ''), 'Não informado')
        when 'prioridade' then coalesce(nullif(trim(s.prioridade), ''), 'Não informado')
        when 'status' then coalesce(nullif(trim(s.status), ''), 'Não informado')
        when 'equipe' then coalesce(nullif(trim(s.equipe), ''), 'Não informado')
        when 'epico' then coalesce(nullif(trim(s.epico), ''), 'Não informado')
        when 'sprint' then coalesce(nullif(trim(s.sprint), ''), 'Não informado')
        when 'categoria' then coalesce(nullif(trim(s.categoria), ''), 'Sem categoria')
        when 'qualidade_modulo_ok' then coalesce(nullif(trim(s.modulo_ok), ''), 'Não informado')
        when 'qualidade_area_ok' then coalesce(nullif(trim(s.area_ok), ''), 'Não informado')
        when 'qualidade_padrao_titulo' then coalesce(nullif(trim(s.padrao_titulo), ''), 'Não informado')
        when 'qualidade_padrao_completo' then coalesce(nullif(trim(s.padrao_completo), ''), 'Não informado')
        else 'Outros'
      end as lbl,
      count(*)::bigint as qty
    from scoped s
    group by 1
  )
  select g.lbl as label, g.qty as quantidade
  from grouped g
  order by g.qty desc, g.lbl asc
  limit case when p_limit is null or p_limit <= 0 then null else p_limit end;
$$;

-- =============================================================================
-- Fluxo temporal: criados × fechados × backlog líquido por mês
-- =============================================================================
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
  backlog_liquido bigint
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
  ),
  agg as (
    select
      m.mes,
      (select count(*) from f where to_char(date_trunc('month', criado_em), 'YYYY/MM') = m.mes)::bigint as criados,
      (select count(*) from f where to_char(date_trunc('month', fechado_em), 'YYYY/MM') = m.mes)::bigint as fechados
    from meses m
  )
  select
    a.mes,
    a.criados,
    a.fechados,
    sum(a.criados - a.fechados) over (order by a.mes rows between unbounded preceding and current row)::bigint as backlog_liquido
  from agg a
  order by a.mes;
$$;

-- =============================================================================
-- Lead time por módulo (média, mediana, contagem)
-- =============================================================================
create or replace function public.dashboard_lead_time_por_modulo(
  p_ano integer default null,
  p_parceria text default null,
  p_sprint text default null,
  p_limit integer default 15
)
returns table (
  modulo text,
  itens bigint,
  lead_medio numeric,
  lead_mediano numeric
)
language sql
stable
as $$
  with f as (
    select * from public._issues_filtered(
      null, null, null, null, null, null,
      p_parceria, p_sprint, null, null, null,
      p_ano, null, null, null, null
    )
  )
  select
    coalesce(nullif(trim(f.modulo), ''), 'Não informado') as modulo,
    count(*) filter (where f.lead_time_dias is not null)::bigint as itens,
    round(avg(f.lead_time_dias) filter (where f.lead_time_dias is not null), 1) as lead_medio,
    percentile_cont(0.5) within group (order by f.lead_time_dias)
      filter (where f.lead_time_dias is not null)::numeric as lead_mediano
  from f
  group by 1
  having count(*) filter (where f.lead_time_dias is not null) > 0
  order by lead_medio desc nulls last
  limit greatest(coalesce(p_limit, 15), 1);
$$;

-- =============================================================================
-- KPI por tipo de issue (Total / Abertas / Fechadas / Taxa / Lead médio / mediano)
-- =============================================================================
create or replace function public.dashboard_kpis_por_tipo(
  p_ano integer default null,
  p_parceria text default null,
  p_sprint text default null
)
returns table (
  tipo text,
  total bigint,
  abertas bigint,
  fechadas bigint,
  taxa_fechamento numeric,
  lead_medio numeric,
  lead_mediano numeric
)
language sql
stable
as $$
  with f as (
    select * from public._issues_filtered(
      null, null, null, null, null, null,
      p_parceria, p_sprint, null, null, null,
      p_ano, null, null, null, null
    )
  )
  select
    coalesce(nullif(trim(f.tipo), ''), 'Não informado') as tipo,
    count(*)::bigint as total,
    count(*) filter (where f.aberto is true)::bigint as abertas,
    count(*) filter (where f.fechado is true)::bigint as fechadas,
    case when count(*) > 0
         then round((count(*) filter (where f.fechado is true)::numeric / count(*)) * 100, 1)
         else 0 end as taxa_fechamento,
    round(avg(f.lead_time_dias) filter (where f.lead_time_dias is not null), 1) as lead_medio,
    percentile_cont(0.5) within group (order by f.lead_time_dias)
      filter (where f.lead_time_dias is not null)::numeric as lead_mediano
  from f
  group by 1
  order by total desc;
$$;

-- =============================================================================
-- Top N issues com maior lead time
-- =============================================================================
create or replace function public.dashboard_top_lead_times(
  p_limit integer default 20,
  p_ano integer default null
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
  select
    i.gitlab_iid as id,
    i.titulo,
    coalesce(nullif(trim(i.modulo), ''), 'Não informado') as modulo,
    coalesce(nullif(trim(i.area_funcional), ''), '—') as area,
    i.estado,
    i.status,
    i.prioridade,
    i.equipe,
    i.criado_em,
    i.fechado_em,
    i.lead_time_dias as lead_time
  from public.issues i
  where i.lead_time_dias is not null
    and (p_ano is null or p_ano = 0 or i.ano_criacao = p_ano)
  order by i.lead_time_dias desc nulls last
  limit greatest(coalesce(p_limit, 20), 1);
$$;

-- =============================================================================
-- Alertas: sem épico / sem parceria / faixa de idade
-- =============================================================================
create or replace function public.dashboard_alertas_resumo()
returns table (
  abertas bigint,
  sem_epico bigint,
  sem_parceria bigint
)
language sql
stable
as $$
  select
    count(*) filter (where aberto is true)::bigint,
    count(*) filter (where aberto is true and coalesce(trim(epico), '') = '')::bigint,
    count(*) filter (where aberto is true and coalesce(trim(parceria), '') = '')::bigint
  from public.issues;
$$;

create or replace function public.dashboard_alertas_por_modulo(
  p_dimensao text  -- 'sem_epico' | 'sem_parceria'
)
returns table (
  modulo text,
  qtde bigint,
  percentual numeric
)
language sql
stable
as $$
  with base as (
    select coalesce(nullif(trim(modulo), ''), 'Outros') as modulo
    from public.issues
    where aberto is true
      and (
        (p_dimensao = 'sem_epico' and coalesce(trim(epico), '') = '')
        or (p_dimensao = 'sem_parceria' and coalesce(trim(parceria), '') = '')
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
      when idade_dias is null then 'Sem dado'
      when idade_dias <= 30 then '0-30 dias'
      when idade_dias <= 60 then '31-60 dias'
      when idade_dias <= 90 then '61-90 dias'
      when idade_dias <= 120 then '91-120 dias'
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

-- =============================================================================
-- View consolidada para opções de filtro (todas as dimensões)
-- =============================================================================
create or replace view public.v_filter_options_full as
select
  array(select distinct coalesce(nullif(trim(modulo), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as modulos,
  array(select distinct coalesce(nullif(trim(area_funcional), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as areas,
  array(select distinct coalesce(nullif(trim(tipo), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as tipos,
  array(select distinct coalesce(nullif(trim(prioridade), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as prioridades,
  array(select distinct coalesce(nullif(trim(equipe), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as equipes,
  array(select distinct coalesce(nullif(trim(status), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as statuses,
  array(select distinct coalesce(nullif(trim(parceria), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as parcerias,
  array(select distinct coalesce(nullif(trim(sprint), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as sprints,
  array(select distinct coalesce(nullif(trim(epico), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as epicos,
  array(select distinct coalesce(nullif(trim(repositorio), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as repositorios,
  array(select distinct ano_criacao from public.issues where ano_criacao is not null order by 1 desc) as anos;

-- =============================================================================
-- Grants
-- =============================================================================
grant execute on function public.dashboard_kpis_full(
  text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date
) to anon, authenticated, service_role;

grant execute on function public.dashboard_aggregate_v2(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date, integer, boolean
) to anon, authenticated, service_role;

grant execute on function public.dashboard_fluxo_mensal(
  text, text, text, text, text, text, text, text, text, text, text, integer
) to anon, authenticated, service_role;

grant execute on function public.dashboard_lead_time_por_modulo(integer, text, text, integer)
  to anon, authenticated, service_role;

grant execute on function public.dashboard_kpis_por_tipo(integer, text, text)
  to anon, authenticated, service_role;

grant execute on function public.dashboard_top_lead_times(integer, integer)
  to anon, authenticated, service_role;

grant execute on function public.dashboard_alertas_resumo()
  to anon, authenticated, service_role;

grant execute on function public.dashboard_alertas_por_modulo(text)
  to anon, authenticated, service_role;

grant execute on function public.dashboard_faixa_idade()
  to anon, authenticated, service_role;

grant select on public.v_filter_options_full to anon, authenticated, service_role;


-- -----------------------------------------------------------------------------
-- migration: 004_issues_search.sql
-- -----------------------------------------------------------------------------

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


-- -----------------------------------------------------------------------------
-- migration: 005_modulo_area_pairs.sql
-- -----------------------------------------------------------------------------

-- =============================================================================
-- Migration 005 — Pares Módulo ↔ Área Funcional (para filtros em cascata)
-- =============================================================================

create or replace view public.v_modulo_area_pairs as
select distinct
  coalesce(nullif(trim(modulo), ''), 'Não informado') as modulo,
  coalesce(nullif(trim(area_funcional), ''), 'Não informado') as area
from public.issues
where coalesce(ano_criacao, 0) >= 2024
order by 1, 2;

grant select on public.v_modulo_area_pairs to anon, authenticated, service_role;


-- -----------------------------------------------------------------------------
-- migration: 006_schema_hardening.sql
-- -----------------------------------------------------------------------------

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


-- -----------------------------------------------------------------------------
-- migration: 007_anon_least_privilege.sql
-- -----------------------------------------------------------------------------

-- =============================================================================
-- Migration 007 — Menor privilégio para o papel `anon`
--
-- Problema: hoje `anon` tem SELECT em TODAS as colunas de public.issues
-- (policy issues_select_anon + grant). Se o dashboard é público, isso expõe
-- notas internas (observacao_geral, chamado, solicitante, desenvolvedor_futuro).
--
-- Estratégia segura (o app NÃO faz select direto em `issues`, só via RPC/views):
--   1. Tornar as RPCs de leitura SECURITY DEFINER (passam a rodar como o dono,
--      que tem acesso à tabela), com search_path fixo.
--   2. Expor uma view pública sem colunas sensíveis (caminho sancionado).
--   3. Revogar o SELECT direto de `anon` em public.issues.
--
-- As views v_filter_options_full / v_modulo_area_pairs continuam funcionando:
-- views comuns (security_invoker = off) acessam a tabela como o dono da view.
-- `authenticated` (usuários logados) mantém acesso completo; `service_role`
-- (pipeline) não é afetado.
--
-- ⚠️  ATENÇÃO: esta migration altera o modelo de segurança. Aplique primeiro
--     num branch/ambiente de teste do Supabase e valide o dashboard (KPIs,
--     gráficos, busca, filtros) antes de promover para produção.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. RPCs de leitura como SECURITY DEFINER + search_path fixo
-- -----------------------------------------------------------------------------
alter function public.dashboard_aggregate_v2(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date, integer, boolean
) security definer set search_path = public, pg_temp;

alter function public.dashboard_kpis_full(
  text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date
) security definer set search_path = public, pg_temp;

alter function public.dashboard_fluxo_mensal(
  text, text, text, text, text, text, text, text, text, text, text, integer
) security definer set search_path = public, pg_temp;

alter function public.dashboard_lead_time_por_modulo(integer, text, text, integer)
  security definer set search_path = public, pg_temp;

alter function public.dashboard_kpis_por_tipo(integer, text, text)
  security definer set search_path = public, pg_temp;

alter function public.dashboard_top_lead_times(integer, integer)
  security definer set search_path = public, pg_temp;

alter function public.dashboard_alertas_resumo()
  security definer set search_path = public, pg_temp;

alter function public.dashboard_alertas_por_modulo(text)
  security definer set search_path = public, pg_temp;

alter function public.dashboard_faixa_idade()
  security definer set search_path = public, pg_temp;

alter function public.search_issues(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, text, text, text, integer, integer
) security definer set search_path = public, pg_temp;


-- -----------------------------------------------------------------------------
-- 2. View pública sem colunas internas/sensíveis
-- -----------------------------------------------------------------------------
create or replace view public.v_issues_publica as
select
  id,
  issue_key,
  gitlab_repo,
  gitlab_iid,
  titulo,
  modulo,
  modulo_normalizado,
  area_funcional,
  tipo,
  estado,
  status,
  prioridade,
  equipe,
  parceria,
  sprint,
  repositorio,
  desenvolvedor,
  assignee,
  autor,
  criado_em,
  fechado_em,
  lead_time_dias,
  ano_mes_criacao,
  ano_criacao,
  mes_criacao,
  ano_mes_fechamento,
  mes_fechamento,
  aberto,
  fechado,
  public.issue_idade_atual(criado_em, aberto) as idade_dias,
  public.issue_sla_90(criado_em, aberto) as sla_mais_90_dias,
  categoria,
  epico,
  modulo_ok,
  area_ok,
  padrao_titulo,
  padrao_completo,
  confianca_area_pct,
  synced_at,
  updated_at
from public.issues;
-- Colunas deliberadamente OMITIDAS (uso interno):
--   observacao_geral, chamado, solicitante, desenvolvedor_futuro,
--   priorizar, situacao_analise, alteracao_escopo, e os campos dev_* / gitlab_mrs.

grant select on public.v_issues_publica to anon, authenticated, service_role;


-- -----------------------------------------------------------------------------
-- 3. Revogar acesso direto de `anon` à tabela bruta
--    (o app só lê via RPC/views; service_role e authenticated não são afetados)
-- -----------------------------------------------------------------------------
revoke select on public.issues from anon;

-- A policy antiga ainda permitia `anon`; restringe a leitura direta a logados.
drop policy if exists "issues_select_anon" on public.issues;
create policy "issues_select_authenticated"
  on public.issues for select
  to authenticated
  using (true);


-- -----------------------------------------------------------------------------
-- migration: 008_profiles_admin.sql
-- -----------------------------------------------------------------------------

-- =============================================================================
-- Migration 008 — Perfis de usuário, papéis (admin/user) e controle de acesso
-- =============================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'user' check (role in ('admin', 'user')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_profiles_active on public.profiles (active);
create index if not exists idx_profiles_email on public.profiles (email);

-- Backfill perfis para usuários Auth já existentes
insert into public.profiles (id, email, full_name, role, active)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1)),
  'user',
  true
from auth.users u
where u.email is not null
on conflict (id) do update
  set email = excluded.email,
      updated_at = now();

-- Admin inicial (ajuste o e-mail se necessário)
update public.profiles
set role = 'admin', active = true, updated_at = now()
where lower(email) = lower('seu-email@org.gov.br');

-- -----------------------------------------------------------------------------
-- Helpers de autorização
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.active = true
  );
$$;

create or replace function public.current_profile_active()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select p.active from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

grant execute on function public.is_admin() to authenticated, service_role;
grant execute on function public.current_profile_active() to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_insert_admin on public.profiles;
create policy profiles_insert_admin
  on public.profiles for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

-- Trigger updated_at
create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_profiles_updated_at();


-- -----------------------------------------------------------------------------
-- migration: 009_issues_search_filters.sql
-- -----------------------------------------------------------------------------

-- =============================================================================
-- Migration 009 — Filtros de autor/período e ordenação completa em search_issues
-- =============================================================================

-- Opções de autor(a) para filtro da listagem de issues
create or replace view public.v_filter_options_full as
select
  array(select distinct coalesce(nullif(trim(modulo), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as modulos,
  array(select distinct coalesce(nullif(trim(area_funcional), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as areas,
  array(select distinct coalesce(nullif(trim(tipo), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as tipos,
  array(select distinct coalesce(nullif(trim(prioridade), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as prioridades,
  array(select distinct coalesce(nullif(trim(equipe), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as equipes,
  array(select distinct coalesce(nullif(trim(status), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as statuses,
  array(select distinct coalesce(nullif(trim(parceria), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as parcerias,
  array(select distinct coalesce(nullif(trim(sprint), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as sprints,
  array(select distinct coalesce(nullif(trim(epico), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as epicos,
  array(select distinct coalesce(nullif(trim(repositorio), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as repositorios,
  array(select distinct ano_criacao from public.issues where ano_criacao is not null order by 1 desc) as anos,
  array(select distinct coalesce(nullif(trim(autor), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as autores;

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
  p_autor text default null,
  p_criado_de date default null,
  p_criado_ate date default null,
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
      and (p_autor is null or p_autor = 'Todos'
           or (p_autor = 'Não informado' and coalesce(trim(i.autor), '') = '')
           or i.autor = p_autor)
      and (p_criado_de is null or i.criado_em >= p_criado_de)
      and (p_criado_ate is null or i.criado_em < (p_criado_ate + 1))
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
    case when p_order = 'prioridade_asc' then f.prioridade end asc nulls last,
    case when p_order = 'prioridade_desc' then f.prioridade end desc nulls last,
    case when p_order = 'equipe_asc' then f.equipe end asc nulls last,
    case when p_order = 'equipe_desc' then f.equipe end desc nulls last,
    case when p_order = 'criado_em_asc' then f.criado_em end asc nulls last,
    case when p_order = 'criado_em_desc' then f.criado_em end desc nulls last,
    case when p_order = 'lead_time_asc' then f.lead_time_dias end asc nulls last,
    case when p_order = 'lead_time_desc' then f.lead_time_dias end desc nulls last,
    case when p_order = 'idade_asc' then public.issue_idade_atual(f.criado_em, f.aberto) end asc nulls last,
    case when p_order = 'idade_desc' then public.issue_idade_atual(f.criado_em, f.aberto) end desc nulls last
  limit greatest(coalesce(p_limit, 50), 1)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

grant execute on function public.search_issues(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, text, text, text, date, date, text, integer, integer
) to anon, authenticated, service_role;

alter function public.search_issues(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, text, text, text, date, date, text, integer, integer
) security definer set search_path = public, pg_temp;


-- -----------------------------------------------------------------------------
-- migration: 010_analista_relatorios.sql
-- -----------------------------------------------------------------------------

-- =============================================================================
-- Migration 010 — Relatório de atividades do analista (Painel + outras atividades)
-- =============================================================================

create table if not exists public.analista_relatorios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  ano_mes text not null,
  sprint text not null default '',
  outras_atividades text,
  status text not null default 'rascunho' check (status in ('rascunho', 'publicado')),
  publicado_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, ano_mes, sprint)
);

create index if not exists idx_analista_relatorios_user on public.analista_relatorios (user_id);
create index if not exists idx_analista_relatorios_ano_mes on public.analista_relatorios (ano_mes);

alter table public.analista_relatorios enable row level security;

drop policy if exists analista_relatorios_select on public.analista_relatorios;
create policy analista_relatorios_select
  on public.analista_relatorios for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists analista_relatorios_insert on public.analista_relatorios;
create policy analista_relatorios_insert
  on public.analista_relatorios for insert
  to authenticated
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists analista_relatorios_update on public.analista_relatorios;
create policy analista_relatorios_update
  on public.analista_relatorios for update
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

grant select, insert, update on public.analista_relatorios to authenticated;
grant all on public.analista_relatorios to service_role;

create or replace function public.set_analista_relatorios_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  if new.status = 'publicado' and (tg_op = 'INSERT' or old.status is distinct from 'publicado') then
    new.publicado_em = coalesce(new.publicado_em, now());
  end if;
  return new;
end;
$$;

drop trigger if exists analista_relatorios_set_updated_at on public.analista_relatorios;
create trigger analista_relatorios_set_updated_at
  before insert or update on public.analista_relatorios
  for each row
  execute function public.set_analista_relatorios_updated_at();

-- Snapshot automático (KPIs, distribuições e lista de issues)
create or replace function public.analista_relatorio_snapshot(
  p_ano_mes text,
  p_sprint text default null,
  p_modulo text default null
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
      and (
        v_modulo is null
        or (v_modulo = 'Não informado' and coalesce(trim(i.modulo), '') = '')
        or i.modulo = v_modulo
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
      b.titulo,
      coalesce(nullif(trim(b.modulo), ''), 'Não informado') as modulo,
      coalesce(nullif(trim(b.desenvolvedor), ''), nullif(trim(b.assignee), ''), '—') as colaborador,
      case when b.aberto is true then 'Aberta' else 'Fechada' end as status,
      coalesce(nullif(trim(b.status), ''), 'Sem Status') as status_label,
      coalesce(nullif(trim(b.parceria), ''), 'Sem Parceiro') as parceiro,
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
    'por_modulo', coalesce((select jsonb_agg(to_jsonb(m.*) order by m.label) from por_modulo m), '[]'::jsonb),
    'por_parceiro', coalesce((select jsonb_agg(to_jsonb(p.*) order by p.label) from por_parceiro p), '[]'::jsonb),
    'issues', coalesce((select jsonb_agg(to_jsonb(i.*) order by i.gitlab_iid desc) from issues i), '[]'::jsonb)
  )
  into v_result;

  return coalesce(v_result, '{}'::jsonb);
end;
$$;

grant execute on function public.analista_relatorio_snapshot(text, text, text)
  to anon, authenticated, service_role;

alter function public.analista_relatorio_snapshot(text, text, text)
  security definer set search_path = public, pg_temp;


-- -----------------------------------------------------------------------------
-- migration: 011_analista_relatorio_por_autor.sql
-- -----------------------------------------------------------------------------

-- =============================================================================
-- Migration 011 — Relatório de atividades filtrado por autor (issues criadas pela analista)
-- =============================================================================

-- Permite ao admin mapear o perfil ao valor exato usado em issues.autor,
-- caso não coincida com o nome completo (ex.: nome no GitLab diferente do nome civil).
alter table public.profiles
  add column if not exists autor_issues text;

comment on column public.profiles.autor_issues is
  'Valor de issues.autor correspondente a este usuário. Se vazio, usa-se profiles.full_name na comparação.';

-- A assinatura da função muda (novo parâmetro p_autor): é preciso remover a versão antiga.
drop function if exists public.analista_relatorio_snapshot(text, text, text);

create or replace function public.analista_relatorio_snapshot(
  p_ano_mes text,
  p_sprint text default null,
  p_modulo text default null,
  p_autor text default null
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
      and (
        v_modulo is null
        or (v_modulo = 'Não informado' and coalesce(trim(i.modulo), '') = '')
        or i.modulo = v_modulo
      )
      and (
        v_autor is null
        or (v_autor = 'Não informado' and coalesce(trim(i.autor), '') = '')
        or lower(trim(i.autor)) = lower(v_autor)
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
      b.titulo,
      coalesce(nullif(trim(b.modulo), ''), 'Não informado') as modulo,
      coalesce(nullif(trim(b.desenvolvedor), ''), nullif(trim(b.assignee), ''), '—') as colaborador,
      case when b.aberto is true then 'Aberta' else 'Fechada' end as status,
      coalesce(nullif(trim(b.status), ''), 'Sem Status') as status_label,
      coalesce(nullif(trim(b.parceria), ''), 'Sem Parceiro') as parceiro,
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
    'por_modulo', coalesce((select jsonb_agg(to_jsonb(m.*) order by m.label) from por_modulo m), '[]'::jsonb),
    'por_parceiro', coalesce((select jsonb_agg(to_jsonb(p.*) order by p.label) from por_parceiro p), '[]'::jsonb),
    'issues', coalesce((select jsonb_agg(to_jsonb(i.*) order by i.gitlab_iid desc) from issues i), '[]'::jsonb)
  )
  into v_result;

  return coalesce(v_result, '{}'::jsonb);
end;
$$;

grant execute on function public.analista_relatorio_snapshot(text, text, text, text)
  to anon, authenticated, service_role;

alter function public.analista_relatorio_snapshot(text, text, text, text)
  security definer set search_path = public, pg_temp;


-- -----------------------------------------------------------------------------
-- migration: 012_gitlab_identities.sql
-- -----------------------------------------------------------------------------

-- =============================================================================
-- Migration 012 — Identidades GitLab e vínculo issue ↔ usuário por ID
-- =============================================================================

-- Cadastro de usuários GitLab (sincronizado pelo pipeline)
create table if not exists public.gitlab_users (
  id bigint primary key,
  username text not null,
  name text,
  email text,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_gitlab_users_username on public.gitlab_users (lower(username));
create index if not exists idx_gitlab_users_email on public.gitlab_users (lower(email))
  where email is not null and email <> '';

comment on table public.gitlab_users is
  'Usuários GitLab (id global). Fonte da verdade para autor, assignee e desenvolvedor.';

-- Perfil do dashboard → identidade GitLab
alter table public.profiles
  add column if not exists gitlab_user_id bigint references public.gitlab_users (id);

create unique index if not exists idx_profiles_gitlab_user_id
  on public.profiles (gitlab_user_id)
  where gitlab_user_id is not null;

comment on column public.profiles.gitlab_user_id is
  'ID global GitLab vinculado à conta do dashboard.';

-- Colunas denormalizadas em issues (consultas rápidas + compatibilidade)
alter table public.issues
  add column if not exists gitlab_author_id bigint references public.gitlab_users (id);

alter table public.issues
  add column if not exists gitlab_developer_id bigint references public.gitlab_users (id);

alter table public.issues
  add column if not exists gitlab_assignee_ids bigint[] not null default '{}';

create index if not exists idx_issues_gitlab_author_id on public.issues (gitlab_author_id);
create index if not exists idx_issues_gitlab_developer_id on public.issues (gitlab_developer_id);
create index if not exists idx_issues_gitlab_assignee_ids on public.issues using gin (gitlab_assignee_ids);

-- Papéis por issue (author, assignee, developer)
create table if not exists public.issue_participants (
  id uuid primary key default gen_random_uuid(),
  issue_key text not null references public.issues (issue_key) on delete cascade,
  role text not null check (role in ('author', 'assignee', 'developer')),
  gitlab_user_id bigint not null references public.gitlab_users (id),
  is_primary boolean not null default false,
  source text not null default 'gitlab_api',
  display_name text,
  unique (issue_key, role, gitlab_user_id)
);

create index if not exists idx_issue_participants_user_role
  on public.issue_participants (gitlab_user_id, role);

create index if not exists idx_issue_participants_issue_key
  on public.issue_participants (issue_key);

comment on table public.issue_participants is
  'Vínculo N:N entre issues e gitlab_users por papel (author, assignee, developer).';

-- Triggers updated_at
create or replace function public.set_gitlab_users_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists gitlab_users_set_updated_at on public.gitlab_users;
create trigger gitlab_users_set_updated_at
  before update on public.gitlab_users
  for each row
  execute function public.set_gitlab_users_updated_at();

-- RLS: leitura autenticada; escrita via service_role (pipeline)
alter table public.gitlab_users enable row level security;
alter table public.issue_participants enable row level security;

drop policy if exists gitlab_users_select on public.gitlab_users;
create policy gitlab_users_select
  on public.gitlab_users for select
  to authenticated
  using (true);

drop policy if exists issue_participants_select on public.issue_participants;
create policy issue_participants_select
  on public.issue_participants for select
  to authenticated
  using (true);

grant select on public.gitlab_users to authenticated, anon;
grant select on public.issue_participants to authenticated, anon;
grant all on public.gitlab_users to service_role;
grant all on public.issue_participants to service_role;

-- RPC Analistas: filtro por gitlab_user_id (preferencial) ou nome legado (autor)
drop function if exists public.analista_relatorio_snapshot(text, text, text, text);

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
      and (
        v_modulo is null
        or (v_modulo = 'Não informado' and coalesce(trim(i.modulo), '') = '')
        or i.modulo = v_modulo
      )
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
      b.titulo,
      coalesce(nullif(trim(b.modulo), ''), 'Não informado') as modulo,
      coalesce(nullif(trim(b.desenvolvedor), ''), nullif(trim(b.assignee), ''), '—') as colaborador,
      case when b.aberto is true then 'Aberta' else 'Fechada' end as status,
      coalesce(nullif(trim(b.status), ''), 'Sem Status') as status_label,
      coalesce(nullif(trim(b.parceria), ''), 'Sem Parceiro') as parceiro,
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


-- -----------------------------------------------------------------------------
-- migration: 013_analista_snapshot_por_tipo.sql
-- -----------------------------------------------------------------------------

-- =============================================================================
-- Migration 013 — Snapshot analista: distribuição por tipo + tipo/épico na lista
-- =============================================================================

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
      and (
        v_modulo is null
        or (v_modulo = 'Não informado' and coalesce(trim(i.modulo), '') = '')
        or i.modulo = v_modulo
      )
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

alter function public.analista_relatorio_snapshot(text, text, text, text, bigint)
  security definer set search_path = public, pg_temp;


-- -----------------------------------------------------------------------------
-- migration: 014_seed_admin_users.sql
-- -----------------------------------------------------------------------------

-- =============================================================================
-- Migration 014 — Administradores iniciais
-- =============================================================================

update public.profiles
set role = 'admin', active = true, updated_at = now()
where lower(email) in (
  lower('seu-email@org.gov.br'),
  lower('outro-email@org.gov.br')
);


-- -----------------------------------------------------------------------------
-- migration: 015_faixa_idade_extendida.sql
-- -----------------------------------------------------------------------------

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


-- -----------------------------------------------------------------------------
-- migration: 016_faixa_idade_idade_coalesce.sql
-- -----------------------------------------------------------------------------

-- =============================================================================
-- Migration 016 — Faixa de idade: idade coalesce + faixas 121-180 / 181-360 / >1 ano
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
  with abertas as (
    select
      coalesce(
        public.issue_idade_atual(i.criado_em, i.aberto),
        case when i.aberto is true then i.idade_dias end
      ) as idade
    from public.issues i
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

alter function public.dashboard_faixa_idade()
  security definer set search_path = public, pg_temp;

grant execute on function public.dashboard_faixa_idade()
  to anon, authenticated, service_role;


-- -----------------------------------------------------------------------------
-- migration: 017_faixa_idade_security_definer.sql
-- -----------------------------------------------------------------------------

-- =============================================================================
-- Migration 017 — Restaura SECURITY DEFINER em dashboard_faixa_idade
-- =============================================================================
-- CREATE OR REPLACE (015/016) remove SECURITY DEFINER; a RPC passa a rodar
-- como anon/authenticated e falha com "permission denied for table issues".

alter function public.dashboard_faixa_idade()
  security definer set search_path = public, pg_temp;

grant execute on function public.dashboard_faixa_idade()
  to anon, authenticated, service_role;


-- -----------------------------------------------------------------------------
-- migration: 018_alertas_filtros_globais.sql
-- -----------------------------------------------------------------------------

-- =============================================================================
-- Migration 018 — Alertas respeitam filtros globais (_issues_filtered)
-- =============================================================================

drop function if exists public.dashboard_alertas_resumo();
drop function if exists public.dashboard_alertas_por_modulo(text);
drop function if exists public.dashboard_faixa_idade();
drop function if exists public.dashboard_top_lead_times(integer, integer);

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
  p_fechado_ate date default null
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
      p_ano, p_criado_de, p_criado_ate, p_fechado_de, p_fechado_ate
    )
  )
  select
    count(*) filter (where f.aberto is true)::bigint,
    count(*) filter (where f.aberto is true and coalesce(trim(f.epico), '') = '')::bigint,
    count(*) filter (where f.aberto is true and coalesce(trim(f.parceria), '') = '')::bigint
  from f;
$$;

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
  p_fechado_ate date default null
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
      p_ano, p_criado_de, p_criado_ate, p_fechado_de, p_fechado_ate
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
  p_fechado_ate date default null
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
      p_ano, p_criado_de, p_criado_ate, p_fechado_de, p_fechado_ate
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
  p_fechado_ate date default null
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
      p_ano, p_criado_de, p_criado_ate, p_fechado_de, p_fechado_ate
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

alter function public.dashboard_alertas_resumo(
  text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date
) security definer set search_path = public, pg_temp;

alter function public.dashboard_alertas_por_modulo(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date
) security definer set search_path = public, pg_temp;

alter function public.dashboard_faixa_idade(
  text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date
) security definer set search_path = public, pg_temp;

alter function public.dashboard_top_lead_times(
  integer, text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date
) security definer set search_path = public, pg_temp;

grant execute on function public.dashboard_alertas_resumo(
  text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date
) to anon, authenticated, service_role;

grant execute on function public.dashboard_alertas_por_modulo(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date
) to anon, authenticated, service_role;

grant execute on function public.dashboard_faixa_idade(
  text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date
) to anon, authenticated, service_role;

grant execute on function public.dashboard_top_lead_times(
  integer, text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date
) to anon, authenticated, service_role;


-- -----------------------------------------------------------------------------
-- migration: 019_search_issues_faixa_idade.sql
-- -----------------------------------------------------------------------------

-- =============================================================================
-- Migration 019 — search_issues: filtro por faixa de idade (drill-down Alertas)
-- =============================================================================

drop function if exists public.search_issues(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, text, text, text, date, date, text, integer, integer
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
      and (p_autor is null or p_autor = 'Todos'
           or (p_autor = 'Não informado' and coalesce(trim(i.autor), '') = '')
           or i.autor = p_autor)
      and (p_criado_de is null or i.criado_em >= p_criado_de)
      and (p_criado_ate is null or i.criado_em < (p_criado_ate + 1))
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
    f.lead_time_dias,
    public.issue_idade_atual(f.criado_em, f.aberto) as idade_dias,
    public.issue_sla_90(f.criado_em, f.aberto) as sla_mais_90_dias
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
    case when p_order = 'prioridade_asc' then f.prioridade end asc nulls last,
    case when p_order = 'prioridade_desc' then f.prioridade end desc nulls last,
    case when p_order = 'equipe_asc' then f.equipe end asc nulls last,
    case when p_order = 'equipe_desc' then f.equipe end desc nulls last,
    case when p_order = 'criado_em_asc' then f.criado_em end asc nulls last,
    case when p_order = 'criado_em_desc' then f.criado_em end desc nulls last,
    case when p_order = 'lead_time_asc' then f.lead_time_dias end asc nulls last,
    case when p_order = 'lead_time_desc' then f.lead_time_dias end desc nulls last,
    case when p_order = 'idade_asc' then public.issue_idade_atual(f.criado_em, f.aberto) end asc nulls last,
    case when p_order = 'idade_desc' then public.issue_idade_atual(f.criado_em, f.aberto) end desc nulls last
  limit greatest(coalesce(p_limit, 50), 1)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

grant execute on function public.search_issues(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, text, text, text, text, date, date, text, integer, integer
) to anon, authenticated, service_role;

alter function public.search_issues(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, text, text, text, text, date, date, text, integer, integer
) security definer set search_path = public, pg_temp;


-- -----------------------------------------------------------------------------
-- migration: 020_analista_snapshot_gitlab_repo.sql
-- -----------------------------------------------------------------------------

-- =============================================================================
-- Migration 020 — Snapshot analista: expõe gitlab_repo na lista de issues
-- =============================================================================

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
      and (
        v_modulo is null
        or (v_modulo = 'Não informado' and coalesce(trim(i.modulo), '') = '')
        or i.modulo = v_modulo
      )
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


-- -----------------------------------------------------------------------------
-- migration: 021_search_issues_fechado_dates.sql
-- -----------------------------------------------------------------------------

-- =============================================================================
-- Migration 021 — search_issues: filtro por data de fechamento
-- =============================================================================

drop function if exists public.search_issues(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, text, text, text, text, date, date, text, integer, integer
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
      and (p_autor is null or p_autor = 'Todos'
           or (p_autor = 'Não informado' and coalesce(trim(i.autor), '') = '')
           or i.autor = p_autor)
      and (p_criado_de is null or i.criado_em >= p_criado_de)
      and (p_criado_ate is null or i.criado_em < (p_criado_ate + 1))
      and (p_fechado_de is null or i.fechado_em >= p_fechado_de)
      and (p_fechado_ate is null or i.fechado_em < (p_fechado_ate + 1))
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
    f.lead_time_dias,
    public.issue_idade_atual(f.criado_em, f.aberto) as idade_dias,
    public.issue_sla_90(f.criado_em, f.aberto) as sla_mais_90_dias
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
    case when p_order = 'prioridade_asc' then f.prioridade end asc nulls last,
    case when p_order = 'prioridade_desc' then f.prioridade end desc nulls last,
    case when p_order = 'equipe_asc' then f.equipe end asc nulls last,
    case when p_order = 'equipe_desc' then f.equipe end desc nulls last,
    case when p_order = 'criado_em_asc' then f.criado_em end asc nulls last,
    case when p_order = 'criado_em_desc' then f.criado_em end desc nulls last,
    case when p_order = 'fechado_em_asc' then f.fechado_em end asc nulls last,
    case when p_order = 'fechado_em_desc' then f.fechado_em end desc nulls last,
    case when p_order = 'lead_time_asc' then f.lead_time_dias end asc nulls last,
    case when p_order = 'lead_time_desc' then f.lead_time_dias end desc nulls last,
    case when p_order = 'idade_asc' then public.issue_idade_atual(f.criado_em, f.aberto) end asc nulls last,
    case when p_order = 'idade_desc' then public.issue_idade_atual(f.criado_em, f.aberto) end desc nulls last
  limit greatest(coalesce(p_limit, 50), 1)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

grant execute on function public.search_issues(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, text, text, text, text, date, date, date, date, text, integer, integer
) to anon, authenticated, service_role;

alter function public.search_issues(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, text, text, text, text, date, date, date, date, text, integer, integer
) security definer set search_path = public, pg_temp;


-- -----------------------------------------------------------------------------
-- migration: 022_search_issues_exige_parceria.sql
-- -----------------------------------------------------------------------------

-- =============================================================================
-- Migration 022 — search_issues: somente issues com parceria + ordenação por parceria
-- =============================================================================

drop function if exists public.search_issues(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, text, text, text, text, date, date, date, date, text, integer, integer
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
  p_exige_parceria boolean default false,
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
      and (p_autor is null or p_autor = 'Todos'
           or (p_autor = 'Não informado' and coalesce(trim(i.autor), '') = '')
           or i.autor = p_autor)
      and (p_criado_de is null or i.criado_em >= p_criado_de)
      and (p_criado_ate is null or i.criado_em < (p_criado_ate + 1))
      and (p_fechado_de is null or i.fechado_em >= p_fechado_de)
      and (p_fechado_ate is null or i.fechado_em < (p_fechado_ate + 1))
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
    f.lead_time_dias,
    public.issue_idade_atual(f.criado_em, f.aberto) as idade_dias,
    public.issue_sla_90(f.criado_em, f.aberto) as sla_mais_90_dias
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
    case when p_order = 'prioridade_asc' then f.prioridade end asc nulls last,
    case when p_order = 'prioridade_desc' then f.prioridade end desc nulls last,
    case when p_order = 'equipe_asc' then f.equipe end asc nulls last,
    case when p_order = 'equipe_desc' then f.equipe end desc nulls last,
    case when p_order = 'parceria_asc' then coalesce(nullif(trim(f.parceria), ''), 'Não informado') end asc nulls last,
    case when p_order = 'parceria_desc' then coalesce(nullif(trim(f.parceria), ''), 'Não informado') end desc nulls last,
    case when p_order = 'criado_em_asc' then f.criado_em end asc nulls last,
    case when p_order = 'criado_em_desc' then f.criado_em end desc nulls last,
    case when p_order = 'fechado_em_asc' then f.fechado_em end asc nulls last,
    case when p_order = 'fechado_em_desc' then f.fechado_em end desc nulls last,
    case when p_order = 'lead_time_asc' then f.lead_time_dias end asc nulls last,
    case when p_order = 'lead_time_desc' then f.lead_time_dias end desc nulls last,
    case when p_order = 'idade_asc' then public.issue_idade_atual(f.criado_em, f.aberto) end asc nulls last,
    case when p_order = 'idade_desc' then public.issue_idade_atual(f.criado_em, f.aberto) end desc nulls last,
    f.fechado_em desc nulls last,
    f.gitlab_iid desc nulls last
  limit greatest(coalesce(p_limit, 50), 1)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

grant execute on function public.search_issues(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, text, text, text, text, date, date, date, date, boolean, text, integer, integer
) to anon, authenticated, service_role;

alter function public.search_issues(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, text, text, text, text, date, date, date, date, boolean, text, integer, integer
) security definer set search_path = public, pg_temp;


-- -----------------------------------------------------------------------------
-- migration: 023_issues_entrega_prevista.sql
-- -----------------------------------------------------------------------------

-- =============================================================================
-- Migration 023 — Data prevista (due) do GitLab + search_issues
-- =============================================================================

alter table public.issues
  add column if not exists entrega_prevista date;

create index if not exists idx_issues_entrega_prevista on public.issues (entrega_prevista);

drop function if exists public.search_issues(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, text, text, text, text, date, date, date, date, boolean, text, integer, integer
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
  p_exige_parceria boolean default false,
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
  entrega_prevista date,
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
      and (p_autor is null or p_autor = 'Todos'
           or (p_autor = 'Não informado' and coalesce(trim(i.autor), '') = '')
           or i.autor = p_autor)
      and (p_criado_de is null or i.criado_em >= p_criado_de)
      and (p_criado_ate is null or i.criado_em < (p_criado_ate + 1))
      and (p_fechado_de is null or i.fechado_em >= p_fechado_de)
      and (p_fechado_ate is null or i.fechado_em < (p_fechado_ate + 1))
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
    public.issue_sla_90(f.criado_em, f.aberto) as sla_mais_90_dias
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
    case when p_order = 'prioridade_asc' then f.prioridade end asc nulls last,
    case when p_order = 'prioridade_desc' then f.prioridade end desc nulls last,
    case when p_order = 'equipe_asc' then f.equipe end asc nulls last,
    case when p_order = 'equipe_desc' then f.equipe end desc nulls last,
    case when p_order = 'parceria_asc' then coalesce(nullif(trim(f.parceria), ''), 'Não informado') end asc nulls last,
    case when p_order = 'parceria_desc' then coalesce(nullif(trim(f.parceria), ''), 'Não informado') end desc nulls last,
    case when p_order = 'criado_em_asc' then f.criado_em end asc nulls last,
    case when p_order = 'criado_em_desc' then f.criado_em end desc nulls last,
    case when p_order = 'fechado_em_asc' then f.fechado_em end asc nulls last,
    case when p_order = 'fechado_em_desc' then f.fechado_em end desc nulls last,
    case when p_order = 'lead_time_asc' then f.lead_time_dias end asc nulls last,
    case when p_order = 'lead_time_desc' then f.lead_time_dias end desc nulls last,
    case when p_order = 'idade_asc' then public.issue_idade_atual(f.criado_em, f.aberto) end asc nulls last,
    case when p_order = 'idade_desc' then public.issue_idade_atual(f.criado_em, f.aberto) end desc nulls last,
    f.fechado_em desc nulls last,
    f.gitlab_iid desc nulls last
  limit greatest(coalesce(p_limit, 50), 1)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

grant execute on function public.search_issues(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, text, text, text, text, date, date, date, date, boolean, text, integer, integer
) to anon, authenticated, service_role;

alter function public.search_issues(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, text, text, text, text, date, date, date, date, boolean, text, integer, integer
) security definer set search_path = public, pg_temp;


-- -----------------------------------------------------------------------------
-- migration: 024_search_issues_status_order.sql
-- -----------------------------------------------------------------------------

-- =============================================================================
-- Migration 024 — Ordenação por status em search_issues
-- =============================================================================

drop function if exists public.search_issues(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, text, text, text, text, date, date, date, date, boolean, text, integer, integer
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
  p_exige_parceria boolean default false,
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
  entrega_prevista date,
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
      and (p_autor is null or p_autor = 'Todos'
           or (p_autor = 'Não informado' and coalesce(trim(i.autor), '') = '')
           or i.autor = p_autor)
      and (p_criado_de is null or i.criado_em >= p_criado_de)
      and (p_criado_ate is null or i.criado_em < (p_criado_ate + 1))
      and (p_fechado_de is null or i.fechado_em >= p_fechado_de)
      and (p_fechado_ate is null or i.fechado_em < (p_fechado_ate + 1))
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
    public.issue_sla_90(f.criado_em, f.aberto) as sla_mais_90_dias
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
    case when p_order = 'fechado_em_asc' then f.fechado_em end asc nulls last,
    case when p_order = 'fechado_em_desc' then f.fechado_em end desc nulls last,
    case when p_order = 'lead_time_asc' then f.lead_time_dias end asc nulls last,
    case when p_order = 'lead_time_desc' then f.lead_time_dias end desc nulls last,
    case when p_order = 'idade_asc' then public.issue_idade_atual(f.criado_em, f.aberto) end asc nulls last,
    case when p_order = 'idade_desc' then public.issue_idade_atual(f.criado_em, f.aberto) end desc nulls last,
    f.fechado_em desc nulls last,
    f.gitlab_iid desc nulls last
  limit greatest(coalesce(p_limit, 50), 1)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

grant execute on function public.search_issues(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, text, text, text, text, date, date, date, date, boolean, text, integer, integer
) to anon, authenticated, service_role;

alter function public.search_issues(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, text, text, text, text, date, date, date, date, boolean, text, integer, integer
) security definer set search_path = public, pg_temp;


-- -----------------------------------------------------------------------------
-- migration: 025_search_issues_entrega_order.sql
-- -----------------------------------------------------------------------------

-- =============================================================================
-- Migration 025 — Ordenação por data prevista (entrega_prevista) em search_issues
-- =============================================================================

drop function if exists public.search_issues(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, text, text, text, text, date, date, date, date, boolean, text, integer, integer
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
  p_exige_parceria boolean default false,
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
  entrega_prevista date,
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
      and (p_autor is null or p_autor = 'Todos'
           or (p_autor = 'Não informado' and coalesce(trim(i.autor), '') = '')
           or i.autor = p_autor)
      and (p_criado_de is null or i.criado_em >= p_criado_de)
      and (p_criado_ate is null or i.criado_em < (p_criado_ate + 1))
      and (p_fechado_de is null or i.fechado_em >= p_fechado_de)
      and (p_fechado_ate is null or i.fechado_em < (p_fechado_ate + 1))
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
    public.issue_sla_90(f.criado_em, f.aberto) as sla_mais_90_dias
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
    f.fechado_em desc nulls last,
    f.gitlab_iid desc nulls last
  limit greatest(coalesce(p_limit, 50), 1)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

grant execute on function public.search_issues(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, text, text, text, text, date, date, date, date, boolean, text, integer, integer
) to anon, authenticated, service_role;

alter function public.search_issues(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, text, text, text, text, date, date, date, date, boolean, text, integer, integer
) security definer set search_path = public, pg_temp;


-- -----------------------------------------------------------------------------
-- migration: 026_flow_reports.sql
-- -----------------------------------------------------------------------------

-- =============================================================================
-- Migration 026 — Relatório de fluxo / Kanban (CFD, throughput, lead time, WIP)
-- =============================================================================
-- Aproximações sem histórico de transições: ver docs/11-relatorio-fluxo.md
-- Histórico futuro: issue_status_events + issue_status_snapshots (coleta incremental)

-- -----------------------------------------------------------------------------
-- Infraestrutura para histórico incremental (snapshots diários + eventos)
-- -----------------------------------------------------------------------------
create table if not exists public.issue_status_snapshots (
  snapshot_date date not null,
  issue_key text not null references public.issues (issue_key) on delete cascade,
  status text,
  etapa text not null,
  estado text,
  synced_at timestamptz not null default now(),
  primary key (snapshot_date, issue_key)
);

create index if not exists idx_issue_status_snapshots_date
  on public.issue_status_snapshots (snapshot_date);

create index if not exists idx_issue_status_snapshots_etapa
  on public.issue_status_snapshots (snapshot_date, etapa);

comment on table public.issue_status_snapshots is
  'Snapshot diário do status/etapa de cada issue. Populado pelo pipeline (snapshot_issue_status.py).';

create table if not exists public.issue_status_events (
  id uuid primary key default gen_random_uuid(),
  issue_key text not null references public.issues (issue_key) on delete cascade,
  event_at timestamptz not null,
  event_type text not null,
  status_anterior text,
  status_novo text,
  etapa_anterior text,
  etapa_nova text,
  source text not null default 'gitlab_api',
  gitlab_event_id bigint,
  synced_at timestamptz not null default now()
);

create unique index if not exists idx_issue_status_events_dedup
  on public.issue_status_events (
    issue_key,
    event_at,
    event_type,
    coalesce(status_novo, '')
  );

create index if not exists idx_issue_status_events_issue_at
  on public.issue_status_events (issue_key, event_at);

comment on table public.issue_status_events is
  'Histórico de mudanças de status (GitLab resource label events). Coleta futura pelo pipeline.';

-- Cache opcional para CFD (refresh batch diário)
create table if not exists public.flow_cfd_cache (
  data_referencia date not null,
  etapa text not null,
  quantidade bigint not null,
  filter_hash text not null default '',
  refreshed_at timestamptz not null default now(),
  primary key (data_referencia, etapa, filter_hash)
);

create index if not exists idx_flow_cfd_cache_hash_date
  on public.flow_cfd_cache (filter_hash, data_referencia);

-- -----------------------------------------------------------------------------
-- Mapeamento status GitLab → etapa Kanban gerencial
-- -----------------------------------------------------------------------------
create or replace function public.flow_normalize_status_key(p_status text)
returns text
language sql
immutable
as $$
  select translate(
    lower(trim(regexp_replace(coalesce(p_status, ''), '\s+', ' ', 'g'))),
    'áàâãäéèêëíìîïóòôõöúùûüçñ',
    'aaaaaeeeeiiiiooooouuuucn'
  );
$$;

create or replace function public.flow_map_etapa(p_status text, p_estado text)
returns text
language plpgsql
immutable
as $$
declare
  s text;
begin
  s := public.flow_normalize_status_key(p_status);

  if coalesce(p_estado, '') = 'Fechado'
     or s in ('delivered', 'done', 'concluida', 'fechada', 'finalizado', 'finalizada') then
    return 'Concluído';
  end if;

  if s in ('cancelado', 'cancelada', 'recusado', 'recusada', 'canceled', 'rejected') then
    return 'Cancelado';
  end if;

  if s in ('backlog', 'aberta', '') then
    return 'Backlog';
  end if;

  if s in ('sprint atual', 'a fazer', 'todo', 'to do', 'fazer') then
    return 'A Fazer';
  end if;

  if s in ('doing', 'em andamento', 'desenvolvimento', 'em desenvolvimento', 'dev') then
    return 'Em Desenvolvimento';
  end if;

  if s in ('em revisao', 'teste', 'em teste', 'qa', 'review') then
    return 'Em Teste';
  end if;

  if s in ('homologacao', 'uat', 'hml') then
    return 'Homologação';
  end if;

  return 'Backlog';
end;
$$;

create or replace function public.flow_is_wip_etapa(p_etapa text)
returns boolean
language sql
immutable
as $$
  select p_etapa in ('A Fazer', 'Em Desenvolvimento', 'Em Teste', 'Homologação');
$$;

create or replace function public.flow_is_excluded_etapa(p_etapa text)
returns boolean
language sql
immutable
as $$
  select p_etapa in ('Concluído', 'Cancelado');
$$;

-- Etapa de uma issue em uma data de referência (CFD)
-- Sem histórico: status atual entre criado_em e fechado_em; Concluído a partir de fechado_em.
create or replace function public.flow_etapa_on_date(
  p_status text,
  p_estado text,
  p_criado_em timestamptz,
  p_fechado_em timestamptz,
  p_ref date
)
returns text
language sql
stable
as $$
  select case
    when p_criado_em is null or p_criado_em::date > p_ref then null
    when p_fechado_em is not null and p_fechado_em::date <= p_ref then 'Concluído'
    when public.flow_map_etapa(p_status, p_estado) = 'Cancelado' then 'Cancelado'
    else public.flow_map_etapa(p_status, p_estado)
  end;
$$;

-- Data de início no fluxo (preferência: A Fazer/Desenvolvimento; fallback: criado_em)
create or replace function public.flow_data_inicio_fluxo(
  p_criado_em timestamptz,
  p_status text,
  p_estado text
)
returns date
language sql
stable
as $$
  select coalesce(p_criado_em::date, current_date);
$$;

comment on function public.flow_data_inicio_fluxo is
  'Sem issue_status_events: usa criado_em como proxy. Com eventos futuros, migrar para primeira entrada em A Fazer/Desenvolvimento.';

-- -----------------------------------------------------------------------------
-- Filtros estendidos para relatório de fluxo
-- -----------------------------------------------------------------------------
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
  where (p_modulo is null or p_modulo = 'Todos'
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

-- Etapas ordenadas do CFD
create or replace function public.flow_cfd_etapas()
returns text[]
language sql
immutable
as $$
  select array[
    'Backlog', 'A Fazer', 'Em Desenvolvimento', 'Em Teste', 'Homologação', 'Concluído', 'Cancelado'
  ]::text[];
$$;

-- =============================================================================
-- 1. CFD — Diagrama de Fluxo Cumulativo (série diária)
-- =============================================================================
create or replace function public.report_flow_cfd(
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
  p_end_date date default null
)
returns table (
  data_referencia date,
  etapa text,
  quantidade bigint
)
language sql
stable
as $$
  with bounds as (
    select
      coalesce(p_start_date, (select min(criado_em::date) from public.issues)) as d_start,
      coalesce(p_end_date, current_date) as d_end
  ),
  days as (
    select gs::date as ref
    from bounds b,
    generate_series(b.d_start, b.d_end, interval '1 day') gs
    where b.d_start is not null
  ),
  issues_scoped as (
    select i.*
    from public._flow_issues_filtered(
      p_modulo, p_area, p_tipo, p_prioridade, p_equipe, p_status,
      p_parceria, p_sprint, p_epico, p_repositorio, p_situacao,
      p_ano, p_assignee,
      (select d_start from bounds),
      (select d_end from bounds),
      true, false
    ) i
  ),
  snap_historico as (
    select
      s.snapshot_date as ref,
      s.issue_key,
      s.etapa
    from public.issue_status_snapshots s
    join issues_scoped i on i.issue_key = s.issue_key
    cross join bounds b
    where s.snapshot_date between b.d_start and b.d_end
  ),
  daily_etapa as (
    select
      d.ref as data_referencia,
      coalesce(sh.etapa, public.flow_etapa_on_date(
        i.status, i.estado, i.criado_em, i.fechado_em, d.ref
      )) as etapa,
      i.issue_key
    from days d
    cross join issues_scoped i
    left join snap_historico sh
      on sh.ref = d.ref and sh.issue_key = i.issue_key
    where public.flow_etapa_on_date(i.status, i.estado, i.criado_em, i.fechado_em, d.ref) is not null
       or sh.etapa is not null
  ),
  dedup as (
    select distinct data_referencia, etapa, issue_key
    from daily_etapa
    where etapa is not null
  )
  select
    de.data_referencia,
    de.etapa,
    count(*)::bigint as quantidade
  from dedup de
  group by de.data_referencia, de.etapa
  order by de.data_referencia, array_position(public.flow_cfd_etapas(), de.etapa);
$$;

-- =============================================================================
-- 2. Throughput — issues concluídas por semana e mês
-- =============================================================================
create or replace function public.report_flow_throughput(
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
  p_granularity text default 'week'
)
returns table (
  periodo text,
  quantidade_concluida bigint
)
language sql
stable
as $$
  with bounds as (
    select
      coalesce(p_start_date, date_trunc('year', current_date)::date) as d_start,
      coalesce(p_end_date, current_date) as d_end
  ),
  scoped as (
    select i.*
    from public._flow_issues_filtered(
      p_modulo, p_area, p_tipo, p_prioridade, p_equipe, p_status,
      p_parceria, p_sprint, p_epico, p_repositorio, p_situacao,
      p_ano, p_assignee, null, null, false, false
    ) i
    cross join bounds b
    where i.fechado_em is not null
      and i.fechado_em::date between b.d_start and b.d_end
  ),
  concluded as (
    select
      coalesce(i.fechado_em::date, i.criado_em::date) as done_date
    from scoped i
    where coalesce(i.fechado_em, i.criado_em) is not null
  )
  select
    case
      when coalesce(p_granularity, 'week') = 'month'
        then to_char(date_trunc('month', c.done_date), 'YYYY-MM')
      else to_char(c.done_date, 'IYYY') || '-W' || lpad(to_char(c.done_date, 'IW'), 2, '0')
    end as periodo,
    count(*)::bigint as quantidade_concluida
  from concluded c
  group by 1
  order by min(c.done_date);
$$;

-- =============================================================================
-- 3. Lead Time — detalhe + agregação
-- =============================================================================
create or replace function public.report_flow_lead_time_detail(
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
  p_end_date date default null
)
returns table (
  issue_id uuid,
  issue_key text,
  titulo text,
  data_inicio_fluxo date,
  data_conclusao date,
  lead_time_dias integer
)
language sql
stable
as $$
  with bounds as (
    select
      coalesce(p_start_date, date_trunc('year', current_date)::date) as d_start,
      coalesce(p_end_date, current_date) as d_end
  ),
  scoped as (
    select i.*
    from public._flow_issues_filtered(
      p_modulo, p_area, p_tipo, p_prioridade, p_equipe, p_status,
      p_parceria, p_sprint, p_epico, p_repositorio, p_situacao,
      p_ano, p_assignee, null, null, false, false
    ) i
    cross join bounds b
    where i.fechado_em is not null
      and i.fechado_em::date between b.d_start and b.d_end
      and i.criado_em is not null
  )
  select
    s.id as issue_id,
    s.issue_key,
    s.titulo,
    public.flow_data_inicio_fluxo(s.criado_em, s.status, s.estado) as data_inicio_fluxo,
    s.fechado_em::date as data_conclusao,
    greatest((s.fechado_em::date - public.flow_data_inicio_fluxo(s.criado_em, s.status, s.estado)), 0)::integer as lead_time_dias
  from scoped s
  order by lead_time_dias desc nulls last;
$$;

create or replace function public.report_flow_lead_time_agg(
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
  p_granularity text default 'month'
)
returns table (
  periodo text,
  lead_time_medio numeric,
  lead_time_mediana numeric,
  percentil_85 numeric,
  quantidade bigint
)
language sql
stable
as $$
  with detail as (
    select *
    from public.report_flow_lead_time_detail(
      p_modulo, p_area, p_tipo, p_prioridade, p_equipe, p_status,
      p_parceria, p_sprint, p_epico, p_repositorio, p_situacao,
      p_ano, p_assignee, p_start_date, p_end_date
    )
  ),
  bucketed as (
    select
      case
        when coalesce(p_granularity, 'month') = 'week'
          then to_char(d.data_conclusao, 'IYYY') || '-W' || lpad(to_char(d.data_conclusao, 'IW'), 2, '0')
        else to_char(date_trunc('month', d.data_conclusao), 'YYYY-MM')
      end as periodo,
      d.lead_time_dias
    from detail d
    where d.lead_time_dias is not null
  )
  select
    b.periodo,
    round(avg(b.lead_time_dias)::numeric, 1) as lead_time_medio,
    round(percentile_cont(0.5) within group (order by b.lead_time_dias)::numeric, 1) as lead_time_mediana,
    round(percentile_cont(0.85) within group (order by b.lead_time_dias)::numeric, 1) as percentil_85,
    count(*)::bigint as quantidade
  from bucketed b
  group by b.periodo
  order by min(b.lead_time_dias);
$$;

-- =============================================================================
-- 4. Work Item Age — idade das issues em andamento
-- =============================================================================
create or replace function public.report_flow_work_item_age(
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
  p_limit integer default null
)
returns table (
  issue_id uuid,
  issue_key text,
  titulo text,
  etapa_atual text,
  responsavel text,
  data_inicio_fluxo date,
  dias_em_andamento integer
)
language sql
stable
as $$
  with scoped as (
    select i.*
    from public._flow_issues_filtered(
      p_modulo, p_area, p_tipo, p_prioridade, p_equipe, p_status,
      p_parceria, p_sprint, p_epico, p_repositorio, p_situacao,
      p_ano, p_assignee, null, null, false, true
    ) i
  ),
  enriched as (
    select
      s.id,
      s.issue_key,
      s.titulo,
      public.flow_map_etapa(s.status, s.estado) as etapa_atual,
      coalesce(nullif(trim(s.assignee), ''), nullif(trim(s.desenvolvedor), ''), s.autor, 'Não informado') as responsavel,
      public.flow_data_inicio_fluxo(s.criado_em, s.status, s.estado) as data_inicio_fluxo,
      greatest((current_date - public.flow_data_inicio_fluxo(s.criado_em, s.status, s.estado)), 0)::integer as dias_em_andamento
    from scoped s
    where not public.flow_is_excluded_etapa(public.flow_map_etapa(s.status, s.estado))
  )
  select *
  from enriched e
  order by e.dias_em_andamento desc, e.issue_key
  limit coalesce(p_limit, 1000);
$$;

-- =============================================================================
-- 5. WIP atual por etapa
-- =============================================================================
create or replace function public.report_flow_wip(
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
  p_assignee text default null
)
returns table (
  etapa text,
  quantidade bigint
)
language sql
stable
as $$
  with scoped as (
    select
      public.flow_map_etapa(i.status, i.estado) as etapa
    from public._flow_issues_filtered(
      p_modulo, p_area, p_tipo, p_prioridade, p_equipe, p_status,
      p_parceria, p_sprint, p_epico, p_repositorio, p_situacao,
      p_ano, p_assignee, null, null, false, true
    ) i
  )
  select
    s.etapa,
    count(*)::bigint as quantidade
  from scoped s
  where public.flow_is_wip_etapa(s.etapa)
  group by s.etapa
  order by array_position(
    array['A Fazer', 'Em Desenvolvimento', 'Em Teste', 'Homologação']::text[],
    s.etapa
  );
$$;

-- =============================================================================
-- 6. Gargalos por etapa
-- =============================================================================
create or replace function public.report_flow_bottlenecks(
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
  p_assignee text default null
)
returns table (
  etapa text,
  quantidade_atual bigint,
  idade_media_dias numeric,
  maior_idade_dias integer,
  observacao text
)
language sql
stable
as $$
  with ages as (
    select *
    from public.report_flow_work_item_age(
      p_modulo, p_area, p_tipo, p_prioridade, p_equipe, p_status,
      p_parceria, p_sprint, p_epico, p_repositorio, p_situacao,
      p_ano, p_assignee, null
    )
  ),
  agg as (
    select
      a.etapa_atual as etapa,
      count(*)::bigint as quantidade_atual,
      round(avg(a.dias_em_andamento)::numeric, 1) as idade_media_dias,
      max(a.dias_em_andamento)::integer as maior_idade_dias
    from ages a
    where public.flow_is_wip_etapa(a.etapa_atual)
       or a.etapa_atual = 'Backlog'
    group by a.etapa_atual
  ),
  wip_total as (
    select coalesce(sum(quantidade_atual), 0)::numeric as total from agg where public.flow_is_wip_etapa(etapa)
  )
  select
    a.etapa,
    a.quantidade_atual,
    a.idade_media_dias,
    a.maior_idade_dias,
    case
      when a.etapa = 'Em Desenvolvimento'
           and a.quantidade_atual >= 5
           and a.idade_media_dias >= 14 then
        'Possível retenção no desenvolvimento (WIP alto e idade média elevada).'
      when a.etapa in ('Em Teste', 'Homologação')
           and a.quantidade_atual >= 3
           and a.idade_media_dias >= 7 then
        'Possível gargalo de validação (acúmulo e permanência prolongada).'
      when a.quantidade_atual >= greatest(3, (select total * 0.35 from wip_total))
           and a.idade_media_dias >= 10 then
        'Possível gargalo: volume alto e idade média elevada nesta etapa.'
      else null
    end as observacao
  from agg a
  order by array_position(public.flow_cfd_etapas(), a.etapa);
$$;

-- =============================================================================
-- Batch: snapshot diário a partir do estado atual
-- =============================================================================
create or replace function public.flow_capture_daily_snapshots(p_date date default current_date)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  insert into public.issue_status_snapshots (snapshot_date, issue_key, status, etapa, estado)
  select
    p_date,
    i.issue_key,
    i.status,
    public.flow_map_etapa(i.status, i.estado),
    i.estado
  from public.issues i
  on conflict (snapshot_date, issue_key) do update set
    status = excluded.status,
    etapa = excluded.etapa,
    estado = excluded.estado,
    synced_at = now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- =============================================================================
-- Permissões (SECURITY DEFINER — paridade com demais RPCs do dashboard)
-- =============================================================================
alter function public.report_flow_cfd(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, date, date
) security definer set search_path = public, pg_temp;

alter function public.report_flow_throughput(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, date, date, text
) security definer set search_path = public, pg_temp;

alter function public.report_flow_lead_time_detail(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, date, date
) security definer set search_path = public, pg_temp;

alter function public.report_flow_lead_time_agg(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, date, date, text
) security definer set search_path = public, pg_temp;

alter function public.report_flow_work_item_age(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, integer
) security definer set search_path = public, pg_temp;

alter function public.report_flow_wip(
  text, text, text, text, text, text, text, text, text, text, text, integer, text
) security definer set search_path = public, pg_temp;

alter function public.report_flow_bottlenecks(
  text, text, text, text, text, text, text, text, text, text, text, integer, text
) security definer set search_path = public, pg_temp;

alter function public.flow_capture_daily_snapshots(date)
  security definer set search_path = public, pg_temp;

grant execute on function public.report_flow_cfd(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, date, date
) to anon, authenticated, service_role;

grant execute on function public.report_flow_throughput(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, date, date, text
) to anon, authenticated, service_role;

grant execute on function public.report_flow_lead_time_detail(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, date, date
) to anon, authenticated, service_role;

grant execute on function public.report_flow_lead_time_agg(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, date, date, text
) to anon, authenticated, service_role;

grant execute on function public.report_flow_work_item_age(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, integer
) to anon, authenticated, service_role;

grant execute on function public.report_flow_wip(
  text, text, text, text, text, text, text, text, text, text, text, integer, text
) to anon, authenticated, service_role;

grant execute on function public.report_flow_bottlenecks(
  text, text, text, text, text, text, text, text, text, text, text, integer, text
) to anon, authenticated, service_role;

grant execute on function public.flow_capture_daily_snapshots(date)
  to service_role;

grant select on public.issue_status_snapshots to service_role;
grant select on public.issue_status_events to service_role;
grant select on public.flow_cfd_cache to service_role;


-- -----------------------------------------------------------------------------
-- migration: 027_issue_status_events_pipeline.sql
-- -----------------------------------------------------------------------------

-- Migration 027 — permissões e deduplicação para issue_status_events (pipeline)

-- Upsert idempotente via PostgREST (?on_conflict=gitlab_event_id) — ver migration 028
alter table public.issue_status_events
  drop constraint if exists issue_status_events_gitlab_event_id_key;

alter table public.issue_status_events
  add constraint issue_status_events_gitlab_event_id_key unique (gitlab_event_id);

grant select, insert, update, delete on public.issue_status_events to service_role;

grant select, insert, update, delete on public.issue_status_snapshots to service_role;

comment on column public.issue_status_events.gitlab_event_id is
  'ID do resource_label_event no GitLab; chave idempotente do upsert da pipeline.';


-- -----------------------------------------------------------------------------
-- migration: 028_issue_status_events_upsert_constraint.sql
-- -----------------------------------------------------------------------------

-- Migration 028 — PostgREST exige UNIQUE CONSTRAINT (nao indice parcial) para on_conflict

drop index if exists public.idx_issue_status_events_gitlab_event_id;

alter table public.issue_status_events
  drop constraint if exists issue_status_events_gitlab_event_id_key;

alter table public.issue_status_events
  add constraint issue_status_events_gitlab_event_id_key unique (gitlab_event_id);

comment on constraint issue_status_events_gitlab_event_id_key on public.issue_status_events is
  'Upsert idempotente da pipeline (PostgREST ?on_conflict=gitlab_event_id). NULLs permitidos.';


-- -----------------------------------------------------------------------------
-- migration: 029_flow_events_analytics.sql
-- -----------------------------------------------------------------------------

-- =============================================================================
-- Migration 029 — Relatórios de fluxo a partir de issue_status_events
-- =============================================================================
-- Prioridade por dia/issue: eventos GitLab > snapshot diário > proxy (status atual).
-- Lead time: criado_em → fechado_em. Cycle time: 1ª entrada A Fazer/Dev → fechado_em.

-- -----------------------------------------------------------------------------
-- Segmentos de etapa reconstruídos a partir de eventos
-- -----------------------------------------------------------------------------
create or replace function public.flow_etapa_segments(p_issue_key text)
returns table (
  valid_from date,
  valid_to date,
  etapa text
)
language plpgsql
stable
set search_path = public, pg_temp
as $$
declare
  v_criado date;
  v_current text := 'Backlog';
  v_seg_start date;
  r record;
  v_has_events boolean := false;
begin
  select i.criado_em::date
  into v_criado
  from public.issues i
  where i.issue_key = p_issue_key;

  v_seg_start := coalesce(v_criado, current_date);

  for r in
    select
      e.event_at::date as ev_date,
      e.event_type,
      e.etapa_nova,
      e.etapa_anterior
    from public.issue_status_events e
    where e.issue_key = p_issue_key
    order by e.event_at asc,
             case when e.event_type = 'status_remove' then 0 else 1 end,
             e.id
  loop
    v_has_events := true;

    if r.ev_date > v_seg_start then
      valid_from := v_seg_start;
      valid_to := r.ev_date - 1;
      etapa := v_current;
      if valid_from <= valid_to then
        return next;
      end if;
    end if;

    if r.event_type = 'status_add' and r.etapa_nova is not null then
      v_current := r.etapa_nova;
    elsif r.event_type = 'status_remove' then
      v_current := 'Backlog';
    end if;

    v_seg_start := r.ev_date;
  end loop;

  if v_has_events then
    valid_from := v_seg_start;
    valid_to := null;
    etapa := v_current;
    return next;
  end if;

  return;
end;
$$;

comment on function public.flow_etapa_segments(text) is
  'Reconstrói intervalos de etapa Kanban a partir de issue_status_events.';

-- -----------------------------------------------------------------------------
-- Etapa em uma data: eventos > snapshot > proxy
-- -----------------------------------------------------------------------------
create or replace function public.flow_resolve_etapa_on_date(
  p_issue_key text,
  p_status text,
  p_estado text,
  p_criado_em timestamptz,
  p_fechado_em timestamptz,
  p_ref date,
  p_snapshot_etapa text default null
)
returns text
language sql
stable
set search_path = public, pg_temp
as $$
  select case
    when p_criado_em is null or p_criado_em::date > p_ref then null
    when p_fechado_em is not null and p_fechado_em::date <= p_ref then 'Concluído'
    else coalesce(
      (
        select seg.etapa
        from public.flow_etapa_segments(p_issue_key) seg
        where p_ref >= seg.valid_from
          and (seg.valid_to is null or p_ref <= seg.valid_to)
        order by seg.valid_from desc
        limit 1
      ),
      p_snapshot_etapa,
      public.flow_etapa_on_date(p_status, p_estado, p_criado_em, p_fechado_em, p_ref)
    )
  end;
$$;

comment on function public.flow_resolve_etapa_on_date is
  'Etapa Kanban em p_ref: issue_status_events, fallback snapshot e proxy flow_etapa_on_date.';

-- -----------------------------------------------------------------------------
-- Início do cycle time (1ª entrada em A Fazer ou Em Desenvolvimento)
-- -----------------------------------------------------------------------------
create or replace function public.flow_data_inicio_cycle(
  p_issue_key text,
  p_criado_em timestamptz
)
returns date
language sql
stable
set search_path = public, pg_temp
as $$
  select coalesce(
    (
      select min(e.event_at)::date
      from public.issue_status_events e
      where e.issue_key = p_issue_key
        and e.event_type = 'status_add'
        and e.etapa_nova in ('A Fazer', 'Em Desenvolvimento')
    ),
    p_criado_em::date,
    current_date
  );
$$;

comment on function public.flow_data_inicio_cycle(text, timestamptz) is
  'Data de início do cycle time: 1ª entrada em A Fazer/Desenvolvimento ou criado_em.';

create or replace function public.flow_data_inicio_fluxo(
  p_criado_em timestamptz,
  p_status text,
  p_estado text
)
returns date
language sql
stable
set search_path = public, pg_temp
as $$
  select coalesce(p_criado_em::date, current_date);
$$;

create or replace function public.flow_data_inicio_fluxo(
  p_criado_em timestamptz,
  p_status text,
  p_estado text,
  p_issue_key text
)
returns date
language sql
stable
set search_path = public, pg_temp
as $$
  select public.flow_data_inicio_cycle(p_issue_key, p_criado_em);
$$;

comment on function public.flow_data_inicio_fluxo(timestamptz, text, text) is
  'Proxy legado (criado_em). Preferir overload com issue_key ou flow_data_inicio_cycle.';

comment on function public.flow_data_inicio_fluxo(timestamptz, text, text, text) is
  'Início do fluxo ativo via issue_status_events (cycle time start).';

-- -----------------------------------------------------------------------------
-- 1. CFD — usa flow_resolve_etapa_on_date
-- -----------------------------------------------------------------------------
create or replace function public.report_flow_cfd(
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
  p_end_date date default null
)
returns table (
  data_referencia date,
  etapa text,
  quantidade bigint
)
language sql
stable
set search_path = public, pg_temp
as $$
  with bounds as (
    select
      coalesce(p_start_date, (select min(criado_em::date) from public.issues)) as d_start,
      coalesce(p_end_date, current_date) as d_end
  ),
  days as (
    select gs::date as ref
    from bounds b,
    generate_series(b.d_start, b.d_end, interval '1 day') gs
    where b.d_start is not null
  ),
  issues_scoped as (
    select i.*
    from public._flow_issues_filtered(
      p_modulo, p_area, p_tipo, p_prioridade, p_equipe, p_status,
      p_parceria, p_sprint, p_epico, p_repositorio, p_situacao,
      p_ano, p_assignee,
      (select d_start from bounds),
      (select d_end from bounds),
      true, false
    ) i
  ),
  snap_historico as (
    select
      s.snapshot_date as ref,
      s.issue_key,
      s.etapa
    from public.issue_status_snapshots s
    join issues_scoped i on i.issue_key = s.issue_key
    cross join bounds b
    where s.snapshot_date between b.d_start and b.d_end
  ),
  daily_etapa as (
    select
      d.ref as data_referencia,
      public.flow_resolve_etapa_on_date(
        i.issue_key,
        i.status,
        i.estado,
        i.criado_em,
        i.fechado_em,
        d.ref,
        sh.etapa
      ) as etapa,
      i.issue_key
    from days d
    cross join issues_scoped i
    left join snap_historico sh
      on sh.ref = d.ref and sh.issue_key = i.issue_key
  ),
  dedup as (
    select distinct data_referencia, etapa, issue_key
    from daily_etapa
    where etapa is not null
  )
  select
    de.data_referencia,
    de.etapa,
    count(*)::bigint as quantidade
  from dedup de
  group by de.data_referencia, de.etapa
  order by de.data_referencia, array_position(public.flow_cfd_etapas(), de.etapa);
$$;

-- -----------------------------------------------------------------------------
-- 3. Lead Time + Cycle Time
-- -----------------------------------------------------------------------------
drop function if exists public.report_flow_lead_time_detail(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, date, date
);

create or replace function public.report_flow_lead_time_detail(
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
  p_end_date date default null
)
returns table (
  issue_id uuid,
  issue_key text,
  titulo text,
  data_inicio_fluxo date,
  data_inicio_cycle date,
  data_conclusao date,
  lead_time_dias integer,
  cycle_time_dias integer
)
language sql
stable
set search_path = public, pg_temp
as $$
  with bounds as (
    select
      coalesce(p_start_date, date_trunc('year', current_date)::date) as d_start,
      coalesce(p_end_date, current_date) as d_end
  ),
  scoped as (
    select i.*
    from public._flow_issues_filtered(
      p_modulo, p_area, p_tipo, p_prioridade, p_equipe, p_status,
      p_parceria, p_sprint, p_epico, p_repositorio, p_situacao,
      p_ano, p_assignee, null, null, false, false
    ) i
    cross join bounds b
    where i.fechado_em is not null
      and i.fechado_em::date between b.d_start and b.d_end
      and i.criado_em is not null
  )
  select
    s.id as issue_id,
    s.issue_key,
    s.titulo,
    s.criado_em::date as data_inicio_fluxo,
    public.flow_data_inicio_cycle(s.issue_key, s.criado_em) as data_inicio_cycle,
    s.fechado_em::date as data_conclusao,
    greatest((s.fechado_em::date - s.criado_em::date), 0)::integer as lead_time_dias,
    greatest(
      (s.fechado_em::date - public.flow_data_inicio_cycle(s.issue_key, s.criado_em)),
      0
    )::integer as cycle_time_dias
  from scoped s
  order by lead_time_dias desc nulls last;
$$;

-- -----------------------------------------------------------------------------
-- 4. Work Item Age — idade desde início do fluxo ativo (cycle start)
-- -----------------------------------------------------------------------------
create or replace function public.report_flow_work_item_age(
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
  p_limit integer default null
)
returns table (
  issue_id uuid,
  issue_key text,
  titulo text,
  etapa_atual text,
  responsavel text,
  data_inicio_fluxo date,
  dias_em_andamento integer
)
language sql
stable
set search_path = public, pg_temp
as $$
  with scoped as (
    select i.*
    from public._flow_issues_filtered(
      p_modulo, p_area, p_tipo, p_prioridade, p_equipe, p_status,
      p_parceria, p_sprint, p_epico, p_repositorio, p_situacao,
      p_ano, p_assignee, null, null, false, true
    ) i
  ),
  enriched as (
    select
      s.id,
      s.issue_key,
      s.titulo,
      public.flow_map_etapa(s.status, s.estado) as etapa_atual,
      coalesce(nullif(trim(s.assignee), ''), nullif(trim(s.desenvolvedor), ''), s.autor, 'Não informado') as responsavel,
      public.flow_data_inicio_fluxo(s.criado_em, s.status, s.estado, s.issue_key) as data_inicio_fluxo,
      greatest(
        (current_date - public.flow_data_inicio_fluxo(s.criado_em, s.status, s.estado, s.issue_key)),
        0
      )::integer as dias_em_andamento
    from scoped s
    where not public.flow_is_excluded_etapa(public.flow_map_etapa(s.status, s.estado))
  )
  select *
  from enriched e
  order by e.dias_em_andamento desc, e.issue_key
  limit coalesce(p_limit, 1000);
$$;

-- -----------------------------------------------------------------------------
-- Permissões
-- -----------------------------------------------------------------------------
alter function public.flow_etapa_segments(text)
  security definer set search_path = public, pg_temp;

alter function public.flow_resolve_etapa_on_date(
  text, text, text, timestamptz, timestamptz, date, text
) security definer set search_path = public, pg_temp;

alter function public.flow_data_inicio_cycle(text, timestamptz)
  security definer set search_path = public, pg_temp;

alter function public.flow_data_inicio_fluxo(timestamptz, text, text)
  security definer set search_path = public, pg_temp;

alter function public.flow_data_inicio_fluxo(timestamptz, text, text, text)
  security definer set search_path = public, pg_temp;

grant execute on function public.flow_etapa_segments(text)
  to anon, authenticated, service_role;

grant execute on function public.flow_resolve_etapa_on_date(
  text, text, text, timestamptz, timestamptz, date, text
) to anon, authenticated, service_role;

grant execute on function public.flow_data_inicio_cycle(text, timestamptz)
  to anon, authenticated, service_role;

grant execute on function public.flow_data_inicio_fluxo(timestamptz, text, text)
  to anon, authenticated, service_role;

grant execute on function public.flow_data_inicio_fluxo(timestamptz, text, text, text)
  to anon, authenticated, service_role;

comment on table public.issue_status_events is
  'Histórico de mudanças de status (GitLab resource_label_events). Usado pelas RPCs de fluxo Kanban.';


-- -----------------------------------------------------------------------------
-- migration: 030_flow_reports_security_definer.sql
-- -----------------------------------------------------------------------------

-- =============================================================================
-- Migration 030 — Restaura SECURITY DEFINER nas RPCs de fluxo
-- =============================================================================
-- Migration 029 recriou report_flow_* (e DROP em lead_time_detail). Sem
-- SECURITY DEFINER, o papel anon/authenticated acessa issue_status_events e
-- issue_status_snapshots diretamente — tabelas restritas a service_role.

alter function public._flow_issues_filtered(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, date, date, boolean, boolean
) security definer set search_path = public, pg_temp;

alter function public.report_flow_cfd(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, date, date
) security definer set search_path = public, pg_temp;

alter function public.report_flow_throughput(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, date, date, text
) security definer set search_path = public, pg_temp;

alter function public.report_flow_lead_time_detail(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, date, date
) security definer set search_path = public, pg_temp;

alter function public.report_flow_lead_time_agg(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, date, date, text
) security definer set search_path = public, pg_temp;

alter function public.report_flow_work_item_age(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, integer
) security definer set search_path = public, pg_temp;

alter function public.report_flow_wip(
  text, text, text, text, text, text, text, text, text, text, text, integer, text
) security definer set search_path = public, pg_temp;

alter function public.report_flow_bottlenecks(
  text, text, text, text, text, text, text, text, text, text, text, integer, text
) security definer set search_path = public, pg_temp;

alter function public.flow_etapa_segments(text)
  security definer set search_path = public, pg_temp;

alter function public.flow_resolve_etapa_on_date(
  text, text, text, timestamptz, timestamptz, date, text
) security definer set search_path = public, pg_temp;

alter function public.flow_data_inicio_cycle(text, timestamptz)
  security definer set search_path = public, pg_temp;

alter function public.flow_data_inicio_fluxo(timestamptz, text, text)
  security definer set search_path = public, pg_temp;

alter function public.flow_data_inicio_fluxo(timestamptz, text, text, text)
  security definer set search_path = public, pg_temp;


-- -----------------------------------------------------------------------------
-- migration: 031_flow_cfd_performance.sql
-- -----------------------------------------------------------------------------

-- =============================================================================
-- Migration 031 — CFD performático + RPC last sync
-- =============================================================================
-- report_flow_cfd (029) chamava flow_resolve_etapa_on_date por dia×issue
-- (flow_etapa_segments em loop) → statement timeout.
-- Nova versão: expande segmentos uma vez e faz merge por prioridade.

create or replace function public.dashboard_last_issues_synced_at()
returns timestamptz
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select max(i.synced_at) from public.issues i;
$$;

comment on function public.dashboard_last_issues_synced_at() is
  'Timestamp da última sync de issues (header do dashboard). SECURITY DEFINER.';

grant execute on function public.dashboard_last_issues_synced_at()
  to anon, authenticated, service_role;

create or replace function public.report_flow_cfd(
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
  p_end_date date default null
)
returns table (
  data_referencia date,
  etapa text,
  quantidade bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with bounds as (
    select
      coalesce(p_start_date, (select min(criado_em::date) from public.issues)) as d_start,
      coalesce(p_end_date, current_date) as d_end
  ),
  days as (
    select gs::date as ref
    from bounds b,
    generate_series(b.d_start, b.d_end, interval '1 day') gs
    where b.d_start is not null
  ),
  issues_scoped as (
    select i.*
    from public._flow_issues_filtered(
      p_modulo, p_area, p_tipo, p_prioridade, p_equipe, p_status,
      p_parceria, p_sprint, p_epico, p_repositorio, p_situacao,
      p_ano, p_assignee,
      (select d_start from bounds),
      (select d_end from bounds),
      true, false
    ) i
  ),
  issues_com_eventos as (
    select distinct e.issue_key
    from public.issue_status_events e
    inner join issues_scoped i on i.issue_key = e.issue_key
  ),
  segments as (
    select
      i.issue_key,
      seg.valid_from,
      seg.valid_to,
      seg.etapa
    from issues_scoped i
    inner join issues_com_eventos ev on ev.issue_key = i.issue_key
    cross join lateral public.flow_etapa_segments(i.issue_key) seg
  ),
  event_daily as (
    select
      gs::date as data_referencia,
      s.issue_key,
      s.etapa
    from segments s
    cross join bounds b
    cross join lateral generate_series(
      greatest(s.valid_from, b.d_start),
      least(coalesce(s.valid_to, b.d_end), b.d_end),
      interval '1 day'
    ) gs
    where greatest(s.valid_from, b.d_start) <= least(coalesce(s.valid_to, b.d_end), b.d_end)
  ),
  snap_daily as (
    select
      s.snapshot_date as data_referencia,
      s.issue_key,
      s.etapa
    from public.issue_status_snapshots s
    inner join issues_scoped i on i.issue_key = s.issue_key
    cross join bounds b
    where s.snapshot_date between b.d_start and b.d_end
  ),
  proxy_daily as (
    select
      d.ref as data_referencia,
      i.issue_key,
      public.flow_etapa_on_date(i.status, i.estado, i.criado_em, i.fechado_em, d.ref) as etapa
    from days d
    cross join issues_scoped i
    where public.flow_etapa_on_date(i.status, i.estado, i.criado_em, i.fechado_em, d.ref) is not null
  ),
  combined as (
    select data_referencia, issue_key, etapa, 1 as priority from event_daily
    union all
    select data_referencia, issue_key, etapa, 2 as priority from snap_daily
    union all
    select data_referencia, issue_key, etapa, 3 as priority from proxy_daily
  ),
  ranked as (
    select
      c.data_referencia,
      c.issue_key,
      c.etapa,
      row_number() over (
        partition by c.data_referencia, c.issue_key
        order by c.priority
      ) as rn
    from combined c
    where c.etapa is not null
  ),
  daily_etapa as (
    select
      r.data_referencia,
      case
        when i.fechado_em is not null and i.fechado_em::date <= r.data_referencia then 'Concluído'
        else r.etapa
      end as etapa,
      r.issue_key
    from ranked r
    inner join issues_scoped i on i.issue_key = r.issue_key
    where r.rn = 1
  )
  select
    de.data_referencia,
    de.etapa,
    count(*)::bigint as quantidade
  from daily_etapa de
  where de.etapa is not null
  group by de.data_referencia, de.etapa
  order by de.data_referencia, array_position(public.flow_cfd_etapas(), de.etapa);
$$;

create index if not exists idx_issue_status_events_issue_key
  on public.issue_status_events (issue_key);

comment on function public.report_flow_cfd is
  'CFD diário: eventos (segmentos) > snapshots > proxy. Otimizado para evitar N×M chamadas PL/pgSQL.';

-- fim schema.sql
