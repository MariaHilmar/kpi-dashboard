-- Migration 034 — Base para relatório de milestone e importação (Excel / GitLab)

-- ---------------------------------------------------------------------------
-- Milestones do grupo GitLab (comprasnet)
-- ---------------------------------------------------------------------------
create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  gitlab_group_path text not null default 'comprasnet',
  gitlab_milestone_id bigint not null,
  titulo text not null,
  description text,
  start_date date,
  due_date date,
  state text,
  web_url text,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint milestones_gitlab_group_milestone_unique unique (gitlab_group_path, gitlab_milestone_id)
);

create index if not exists idx_milestones_gitlab_id
  on public.milestones (gitlab_milestone_id);

create index if not exists idx_milestones_titulo
  on public.milestones (titulo);

-- ---------------------------------------------------------------------------
-- Snapshot por issue × milestone (histórico de sprints)
-- ---------------------------------------------------------------------------
create table if not exists public.milestone_issues (
  id uuid primary key default gen_random_uuid(),
  milestone_id uuid not null references public.milestones (id) on delete cascade,
  issue_key text not null,
  gitlab_repo text not null,
  gitlab_iid integer not null,
  titulo text,
  status text,
  assignee text,
  story_points integer,
  gitlab_weight integer,
  aceita text,
  justificada text,
  historico text,
  recorrente text,
  horas_estimada numeric,
  horas_prevista numeric,
  homologado text,
  ultimo_comentario text,
  issue_state text,
  fechado_em timestamptz,
  imported_at timestamptz not null default now(),
  import_source text not null default 'gitlab',
  constraint milestone_issues_milestone_issue_unique unique (milestone_id, issue_key)
);

create index if not exists idx_milestone_issues_milestone
  on public.milestone_issues (milestone_id);

create index if not exists idx_milestone_issues_issue_key
  on public.milestone_issues (issue_key);

create index if not exists idx_milestone_issues_gitlab
  on public.milestone_issues (gitlab_repo, gitlab_iid);

-- ---------------------------------------------------------------------------
-- Auditoria de importações (GitLab / Excel)
-- ---------------------------------------------------------------------------
create table if not exists public.milestone_import_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  milestone_gitlab_id bigint,
  sprint_titulo text,
  rows_processed integer not null default 0,
  rows_upserted integer not null default 0,
  rows_error integer not null default 0,
  message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running'
);

-- ---------------------------------------------------------------------------
-- Colunas denormalizadas em issues (valor mais recente / importação Excel)
-- ---------------------------------------------------------------------------
alter table public.issues
  add column if not exists story_points integer,
  add column if not exists gitlab_weight integer,
  add column if not exists aceita text,
  add column if not exists justificada text,
  add column if not exists historico text,
  add column if not exists recorrente text,
  add column if not exists horas_estimada numeric,
  add column if not exists horas_prevista numeric,
  add column if not exists homologado text,
  add column if not exists ultimo_comentario text,
  add column if not exists milestone_gitlab_id bigint,
  add column if not exists report_fields_synced_at timestamptz;

create index if not exists idx_issues_story_points on public.issues (story_points);
create index if not exists idx_issues_milestone_gitlab_id on public.issues (milestone_gitlab_id);

-- ---------------------------------------------------------------------------
-- Grants (service_role / pipeline)
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on public.milestones to service_role;
grant select, insert, update, delete on public.milestone_issues to service_role;
grant select, insert, update, delete on public.milestone_import_runs to service_role;

grant select on public.milestones to authenticated;
grant select on public.milestone_issues to authenticated;
grant select on public.milestone_import_runs to authenticated;

comment on table public.milestones is
  'Metadados de milestones do grupo GitLab (comprasnet).';

comment on table public.milestone_issues is
  'Snapshot de issues por milestone para relatório histórico e burndown.';

comment on column public.issues.story_points is
  'Story points (Planning Poker / Excel). Preservado pelo sync incremental.';

comment on column public.issues.gitlab_weight is
  'Campo weight nativo do GitLab (Premium).';
