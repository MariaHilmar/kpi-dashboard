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
