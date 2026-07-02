-- Migration 028 — PostgREST exige UNIQUE CONSTRAINT (nao indice parcial) para on_conflict

drop index if exists public.idx_issue_status_events_gitlab_event_id;

alter table public.issue_status_events
  drop constraint if exists issue_status_events_gitlab_event_id_key;

alter table public.issue_status_events
  add constraint issue_status_events_gitlab_event_id_key unique (gitlab_event_id);

comment on constraint issue_status_events_gitlab_event_id_key on public.issue_status_events is
  'Upsert idempotente da pipeline (PostgREST ?on_conflict=gitlab_event_id). NULLs permitidos.';
