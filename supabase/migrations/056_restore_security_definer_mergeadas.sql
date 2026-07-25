-- =============================================================================
-- Migration 056 — Restaura SECURITY DEFINER nas RPCs recriadas (052–055)
--
-- A migration 007 revogou SELECT de anon em public.issues e tornou as RPCs
-- SECURITY DEFINER. As migrations 052–055 recriaram funções sem esse atributo
-- (volta ao INVOKER = anon), causando "permission denied for table issues".
-- =============================================================================

alter function public.dashboard_fluxo_mensal(
  text, text, text, text, text, text, text, text, text, text, text, integer
) security definer set search_path = public, pg_temp;

alter function public.dashboard_kpis_por_tipo(integer, text, text)
  security definer set search_path = public, pg_temp;

alter function public.dashboard_mergeadas_por_periodo(
  text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date
) security definer set search_path = public, pg_temp;

alter function public.dashboard_mergeadas_por_epico(
  text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date, integer
) security definer set search_path = public, pg_temp;

alter function public.dashboard_mergeadas_pivot(
  text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date
) security definer set search_path = public, pg_temp;
