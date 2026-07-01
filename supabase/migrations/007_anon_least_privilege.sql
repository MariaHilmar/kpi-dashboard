-- =============================================================================
-- Migration 007 — Menor privilégio para o papel `anon`
--
-- Problema: hoje `anon` tem SELECT em TODAS as colunas de public.issues
-- (policy issues_select_anon + grant). Se o dashboard é público, isso expõe
-- notas internas (observacao_geral, chamado, solicitante, desenvolvedor_futuro).
--
-- Estratégia segura (o app NÃO faz select direto em `issues`, só via RPC/views):
--   1. Tornar as RPCs de leitura SECURITY DEFINER (passam a rodar como o dono,
--      que tem acesso à tabela), com search_path fixo.
--   2. Expor uma view pública sem colunas sensíveis (caminho sancionado).
--   3. Revogar o SELECT direto de `anon` em public.issues.
--
-- As views v_filter_options_full / v_modulo_area_pairs continuam funcionando:
-- views comuns (security_invoker = off) acessam a tabela como o dono da view.
-- `authenticated` (usuários logados) mantém acesso completo; `service_role`
-- (pipeline) não é afetado.
--
-- ⚠️  ATENÇÃO: esta migration altera o modelo de segurança. Aplique primeiro
--     num branch/ambiente de teste do Supabase e valide o dashboard (KPIs,
--     gráficos, busca, filtros) antes de promover para produção.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. RPCs de leitura como SECURITY DEFINER + search_path fixo
-- -----------------------------------------------------------------------------
alter function public.dashboard_aggregate_v2(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date, integer, boolean
) security definer set search_path = public, pg_temp;

alter function public.dashboard_kpis_full(
  text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date
) security definer set search_path = public, pg_temp;

alter function public.dashboard_fluxo_mensal(
  text, text, text, text, text, text, text, text, text, text, text, integer
) security definer set search_path = public, pg_temp;

alter function public.dashboard_lead_time_por_modulo(integer, text, text, integer)
  security definer set search_path = public, pg_temp;

alter function public.dashboard_kpis_por_tipo(integer, text, text)
  security definer set search_path = public, pg_temp;

alter function public.dashboard_top_lead_times(integer, integer)
  security definer set search_path = public, pg_temp;

alter function public.dashboard_alertas_resumo()
  security definer set search_path = public, pg_temp;

alter function public.dashboard_alertas_por_modulo(text)
  security definer set search_path = public, pg_temp;

alter function public.dashboard_faixa_idade()
  security definer set search_path = public, pg_temp;

alter function public.search_issues(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, text, text, text, integer, integer
) security definer set search_path = public, pg_temp;


-- -----------------------------------------------------------------------------
-- 2. View pública sem colunas internas/sensíveis
-- -----------------------------------------------------------------------------
create or replace view public.v_issues_publica as
select
  id,
  issue_key,
  gitlab_repo,
  gitlab_iid,
  titulo,
  modulo,
  modulo_normalizado,
  area_funcional,
  tipo,
  estado,
  status,
  prioridade,
  equipe,
  parceria,
  sprint,
  repositorio,
  desenvolvedor,
  assignee,
  autor,
  criado_em,
  fechado_em,
  lead_time_dias,
  ano_mes_criacao,
  ano_criacao,
  mes_criacao,
  ano_mes_fechamento,
  mes_fechamento,
  aberto,
  fechado,
  public.issue_idade_atual(criado_em, aberto) as idade_dias,
  public.issue_sla_90(criado_em, aberto) as sla_mais_90_dias,
  categoria,
  epico,
  modulo_ok,
  area_ok,
  padrao_titulo,
  padrao_completo,
  confianca_area_pct,
  synced_at,
  updated_at
from public.issues;
-- Colunas deliberadamente OMITIDAS (uso interno):
--   observacao_geral, chamado, solicitante, desenvolvedor_futuro,
--   priorizar, situacao_analise, alteracao_escopo, e os campos dev_* / gitlab_mrs.

grant select on public.v_issues_publica to anon, authenticated, service_role;


-- -----------------------------------------------------------------------------
-- 3. Revogar acesso direto de `anon` à tabela bruta
--    (o app só lê via RPC/views; service_role e authenticated não são afetados)
-- -----------------------------------------------------------------------------
revoke select on public.issues from anon;

-- A policy antiga ainda permitia `anon`; restringe a leitura direta a logados.
drop policy if exists "issues_select_anon" on public.issues;
create policy "issues_select_authenticated"
  on public.issues for select
  to authenticated
  using (true);
