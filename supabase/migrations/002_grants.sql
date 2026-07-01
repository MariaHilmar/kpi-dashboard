-- Grants para service_role (pipeline Python) e anon (dashboard read-only)

grant usage on schema public to anon, authenticated, service_role;

grant select on public.issues to anon, authenticated;
grant select on public.releases to anon, authenticated;
grant select on public.sync_runs to anon, authenticated;

grant select, insert, update, delete on public.issues to service_role;
grant select, insert, update, delete on public.releases to service_role;
grant select, insert, update on public.sync_runs to service_role;

grant execute on function public.dashboard_aggregate(text, text, text, integer, integer) to anon, authenticated, service_role;
grant execute on function public.dashboard_kpis(text, text, integer) to anon, authenticated, service_role;
