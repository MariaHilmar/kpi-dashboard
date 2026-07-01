-- =============================================================================
-- Migration 014 — Administradores iniciais
-- =============================================================================

update public.profiles
set role = 'admin', active = true, updated_at = now()
where lower(email) in (
  lower('seu-email@org.gov.br'),
  lower('outro-email@org.gov.br')
);
