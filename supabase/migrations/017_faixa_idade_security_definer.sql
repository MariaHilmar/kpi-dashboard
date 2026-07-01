-- =============================================================================
-- Migration 017 — Restaura SECURITY DEFINER em dashboard_faixa_idade
-- =============================================================================
-- CREATE OR REPLACE (015/016) remove SECURITY DEFINER; a RPC passa a rodar
-- como anon/authenticated e falha com "permission denied for table issues".

alter function public.dashboard_faixa_idade()
  security definer set search_path = public, pg_temp;

grant execute on function public.dashboard_faixa_idade()
  to anon, authenticated, service_role;
