-- =============================================================================
-- Migration 049 — Catalogo de epicos GitLab para o filtro global "Épico"
--
-- O pipeline passa a sincronizar GET /groups/:id/epics em public.gitlab_epics.
-- A view de filtros une titulos do catalogo com valores distintos de issues.epico
-- (vinculo issue↔ epico, quando existir).
-- =============================================================================

create table if not exists public.gitlab_epics (
  id uuid primary key default gen_random_uuid(),
  gitlab_group_path text not null default 'comprasnet',
  gitlab_epic_id bigint not null,
  gitlab_epic_iid bigint not null,
  title text not null,
  state text,
  web_url text,
  parent_iid bigint,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gitlab_epics_group_id_unique unique (gitlab_group_path, gitlab_epic_id)
);

create index if not exists idx_gitlab_epics_iid
  on public.gitlab_epics (gitlab_group_path, gitlab_epic_iid);

create index if not exists idx_gitlab_epics_title
  on public.gitlab_epics (title);

create index if not exists idx_gitlab_epics_state
  on public.gitlab_epics (state);

grant select on public.gitlab_epics to anon, authenticated, service_role;
grant insert, update, delete on public.gitlab_epics to service_role;

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
