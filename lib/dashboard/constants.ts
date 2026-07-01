/** Constantes compartilhadas do domínio do dashboard. */

/** Valores de `sync_runs.source` produzidos pelo pipeline GitLab → Supabase. */
export const GITLAB_SYNC_SOURCES = ["json", "gitlab"] as const;

/** Valor sentinela para "sem filtro" em selects e RPCs. */
export const TODOS = "Todos";

/** Rótulo padrão para valores ausentes em agregações. */
export const NAO_INFORMADO = "Não informado";

/** Rótulo de fallback para agrupamentos residuais. */
export const OUTROS = "Outros";

/** Tamanho de página padrão da listagem de issues. */
export const ISSUES_PAGE_SIZE = 50;

/** Limites de "top N" usados nos gráficos por página. */
export const TOP_LIMIT = {
  modulo: 14,
  area: 14,
  equipe: 14,
  equipeWide: 20,
  desenvolvedor: 12,
  leadTimePorModulo: 15,
  topLeadTimes: 20,
} as const;

/** Dimensões aceitas pela RPC `dashboard_aggregate_v2`. */
export const AGGREGATE_DIMENSIONS = [
  "status",
  "tipo",
  "prioridade",
  "modulo",
  "equipe",
  "parceria",
  "repositorio",
  "area_funcional",
  "categoria",
  "desenvolvedor",
  "dev_mergeado",
  "qualidade_modulo_ok",
  "qualidade_area_ok",
  "qualidade_padrao_titulo",
  "qualidade_padrao_completo",
] as const;

export type AggregateDimension = (typeof AGGREGATE_DIMENSIONS)[number];

/** Dimensões usadas pela RPC `dashboard_alertas_por_modulo`. */
export type AlertaDimensao = "sem_epico" | "sem_parceria";

/** Ordem das faixas em Alertas → Issues abertas por idade (RPC `dashboard_faixa_idade`). */
export const FAIXAS_IDADE_ABERTAS = [
  "0-30 dias",
  "31-60 dias",
  "61-90 dias",
  "91-120 dias",
  "121-180 dias",
  "181-360 dias",
  "Mais de 1 ano",
] as const;

/** Opções do filtro faixaIdade na listagem de issues (/issues). */
export const FAIXAS_IDADE_ISSUES = [TODOS, "Sem dado", ...FAIXAS_IDADE_ABERTAS] as const;

/** Estados possíveis no filtro de listagem de issues. */
export type IssueEstado = "Todos" | "open" | "closed";

/** Filtro de SLA na listagem de issues. */
export type IssueSla = "Todos" | "acima_90";
