-- =============================================================================
-- Migration 005 — Pares Módulo ↔ Área Funcional (para filtros em cascata)
-- =============================================================================

create or replace view public.v_modulo_area_pairs as
select distinct
  coalesce(nullif(trim(modulo), ''), 'Não informado') as modulo,
  coalesce(nullif(trim(area_funcional), ''), 'Não informado') as area
from public.issues
where coalesce(ano_criacao, 0) >= 2024
order by 1, 2;

grant select on public.v_modulo_area_pairs to anon, authenticated, service_role;
