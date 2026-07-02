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
