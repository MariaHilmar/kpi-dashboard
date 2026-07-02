-- =============================================================================
-- Migration 030 — Restaura SECURITY DEFINER nas RPCs de fluxo
-- =============================================================================
-- Migration 029 recriou report_flow_* (e DROP em lead_time_detail). Sem
-- SECURITY DEFINER, o papel anon/authenticated acessa issue_status_events e
-- issue_status_snapshots diretamente — tabelas restritas a service_role.

alter function public._flow_issues_filtered(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, date, date, boolean, boolean
) security definer set search_path = public, pg_temp;

alter function public.report_flow_cfd(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, date, date
) security definer set search_path = public, pg_temp;

alter function public.report_flow_throughput(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, date, date, text
) security definer set search_path = public, pg_temp;

alter function public.report_flow_lead_time_detail(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, date, date
) security definer set search_path = public, pg_temp;

alter function public.report_flow_lead_time_agg(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, date, date, text
) security definer set search_path = public, pg_temp;

alter function public.report_flow_work_item_age(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, integer
) security definer set search_path = public, pg_temp;

alter function public.report_flow_wip(
  text, text, text, text, text, text, text, text, text, text, text, integer, text
) security definer set search_path = public, pg_temp;

alter function public.report_flow_bottlenecks(
  text, text, text, text, text, text, text, text, text, text, text, integer, text
) security definer set search_path = public, pg_temp;

alter function public.flow_etapa_segments(text)
  security definer set search_path = public, pg_temp;

alter function public.flow_resolve_etapa_on_date(
  text, text, text, timestamptz, timestamptz, date, text
) security definer set search_path = public, pg_temp;

alter function public.flow_data_inicio_cycle(text, timestamptz)
  security definer set search_path = public, pg_temp;

alter function public.flow_data_inicio_fluxo(timestamptz, text, text)
  security definer set search_path = public, pg_temp;

alter function public.flow_data_inicio_fluxo(timestamptz, text, text, text)
  security definer set search_path = public, pg_temp;
