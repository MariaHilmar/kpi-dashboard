-- =============================================================================
-- Migration 014 — Administradores iniciais
-- =============================================================================

update public.profiles
set role = 'admin', active = true, updated_at = now()
where lower(email) in (
  lower('mariahilmar@gmail.com'),
  lower('anne.knoll@gestao.gov.br')
);
