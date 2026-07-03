-- Migration 035 — IID do milestone (número da URL GitLab: /milestones/90)

alter table public.milestones
  add column if not exists gitlab_milestone_iid integer;

create unique index if not exists idx_milestones_group_iid
  on public.milestones (gitlab_group_path, gitlab_milestone_iid)
  where gitlab_milestone_iid is not null;

comment on column public.milestones.gitlab_milestone_iid is
  'IID do milestone na URL GitLab (ex.: /milestones/90). Distinto de gitlab_milestone_id (ID interno).';
