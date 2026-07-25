-- =============================================================================
-- Migration 050 — Catalogo de tipos (labels tipo::*) + data de merge
--
-- 1. Tabela public.gitlab_tipo_labels: catalogo de tipos vindo dos labels
--    `tipo::*` do GitLab (projetos + grupo). Alimenta o filtro "Tipo" mesmo
--    quando ainda nao ha issues com aquele tipo.
-- 2. Coluna issues.mergeado_em: data do merge em master (melhor esforco via
--    Git local; NULL quando desconhecida).
-- 3. v_filter_options_full.tipos passa a unir issues.tipo com o catalogo.
-- =============================================================================

create table if not exists public.gitlab_tipo_labels (
  tipo text primary key,
  label text not null,
  color text,
  description text,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.gitlab_tipo_labels to anon, authenticated, service_role;
grant insert, update, delete on public.gitlab_tipo_labels to service_role;

alter table public.issues
  add column if not exists mergeado_em timestamptz;

create index if not exists idx_issues_mergeado_em
  on public.issues (mergeado_em);

create or replace view public.v_filter_options_full as
select
  array(select distinct coalesce(nullif(trim(modulo), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as modulos,
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
  array(select distinct coalesce(nullif(trim(autor), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as autores;

grant select on public.v_filter_options_full to anon, authenticated, service_role;
