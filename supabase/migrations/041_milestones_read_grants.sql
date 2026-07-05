-- Migration 041 — Leitura de milestones pelo dashboard (anon + authenticated)
--
-- A migration 034 concedia SELECT só a authenticated; em produção os grants
-- não foram aplicados (tabela visível só para postgres). O Relatório Milestone
-- e Importar Dados leem public.milestones via chave anon (RPCs) ou sessão
-- authenticated — alinhado a releases e demais catálogos públicos do dashboard.

grant select on public.milestones to anon, authenticated;
grant select on public.milestone_issues to anon, authenticated;
grant select on public.milestone_import_runs to anon, authenticated;

CREATE POLICY milestones_select_public
  ON public.milestones
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY milestone_issues_select_public
  ON public.milestone_issues
  FOR SELECT
  TO anon, authenticated
  USING (true);
