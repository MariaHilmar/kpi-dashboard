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
