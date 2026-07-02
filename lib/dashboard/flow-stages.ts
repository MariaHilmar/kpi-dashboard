/** Mapeamento status GitLab → etapa Kanban (espelha flow_map_etapa no Postgres). */

export const FLOW_CFD_ETAPAS = [
  "Backlog",
  "A Fazer",
  "Em Desenvolvimento",
  "Em Teste",
  "Homologação",
  "Concluído",
  "Cancelado",
] as const;

export const FLOW_WIP_ETAPAS = [
  "A Fazer",
  "Em Desenvolvimento",
  "Em Teste",
  "Homologação",
] as const;

/** Etapas incluídas no relatório de dwell time histórico. */
export const FLOW_DWELL_ETAPAS = [
  "Backlog",
  ...FLOW_WIP_ETAPAS,
] as const;

export type FlowEtapa = (typeof FLOW_CFD_ETAPAS)[number];

export function normalizeStatusKey(status: string | null | undefined): string {
  return (status ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ");
}

/** Espelha public.flow_map_etapa — mantido em TS para testes e validação offline. */
export function mapStatusToFlowEtapa(
  status: string | null | undefined,
  estado: string | null | undefined,
): FlowEtapa {
  const s = normalizeStatusKey(status);

  if (
    estado === "Fechado" ||
    ["delivered", "done", "concluida", "fechada", "finalizado", "finalizada"].includes(s)
  ) {
    return "Concluído";
  }

  if (["cancelado", "cancelada", "recusado", "recusada", "canceled", "rejected"].includes(s)) {
    return "Cancelado";
  }

  if (["backlog", "aberta", ""].includes(s)) {
    return "Backlog";
  }

  if (["sprint atual", "a fazer", "todo", "to do", "fazer"].includes(s)) {
    return "A Fazer";
  }

  if (["doing", "em andamento", "desenvolvimento", "em desenvolvimento", "dev"].includes(s)) {
    return "Em Desenvolvimento";
  }

  if (["em revisao", "teste", "em teste", "qa", "review"].includes(s)) {
    return "Em Teste";
  }

  if (["homologacao", "uat", "hml"].includes(s)) {
    return "Homologação";
  }

  return "Backlog";
}

export function isWipEtapa(etapa: string): boolean {
  return (FLOW_WIP_ETAPAS as readonly string[]).includes(etapa);
}

export function isExcludedEtapa(etapa: string): boolean {
  return etapa === "Concluído" || etapa === "Cancelado";
}

/** Aproximação sem histórico: etapa constante entre criado_em e fechado_em. */
export function resolveEtapaOnDate(input: {
  status: string | null | undefined;
  estado: string | null | undefined;
  criadoEm: Date | null;
  fechadoEm: Date | null;
  ref: Date;
}): FlowEtapa | null {
  const { status, estado, criadoEm, fechadoEm, ref } = input;
  if (!criadoEm || startOfDay(criadoEm) > startOfDay(ref)) return null;

  if (fechadoEm && startOfDay(fechadoEm) <= startOfDay(ref)) {
    return "Concluído";
  }

  const etapa = mapStatusToFlowEtapa(status, estado);
  if (etapa === "Cancelado") return "Cancelado";
  return etapa;
}

function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export const FLOW_REPORT_APPROXIMATIONS = {
  cfd:
    "CFD reconstruído a partir de issue_status_events quando disponível. Issues sem histórico no GitLab usam snapshot diário (issue_status_snapshots) ou, na ausência dele, o status atual como proxy entre criado_em e fechado_em.",
  leadTimeStart:
    "Lead time = criado_em → fechado_em. Cycle time = 1ª entrada em A Fazer/Em Desenvolvimento (via issue_status_events) → fechado_em.",
  workItemAge:
    "Idade = hoje − início do fluxo ativo (1ª entrada em A Fazer/Desenvolvimento). Issues sem eventos usam criado_em.",
  bottlenecks:
    "WIP atual + idade desde o início do fluxo ativo. Não inclui tempo histórico detalhado por etapa.",
  stageDwell:
    "Tempo por etapa reconstruído via issue_status_events (segmentos diários). Issues sem histórico no GitLab usam proxy: todo o lead time é atribuído à etapa final mapeada do status de fechamento.",
} as const;

/** Paleta gerencial alinhada ao fluxo GitLab / Gov.br. */
export const FLOW_ETAPA_CHART_COLORS: Record<FlowEtapa, string> = {
  Backlog: "#64748B",
  "A Fazer": "#FFC107",
  "Em Desenvolvimento": "#1351B4",
  "Em Teste": "#7F3F98",
  Homologação: "#59B9DE",
  Concluído: "#168821",
  Cancelado: "#E52207",
};

export function getFlowEtapaChartColor(etapa: string): string {
  return FLOW_ETAPA_CHART_COLORS[etapa as FlowEtapa] ?? "#94A3B8";
}

const FLOW_CFD_WIP_FILL_OPACITY = 0.75;
const FLOW_CFD_TERMINAL_FILL_OPACITY = 0.3;

/** Opacidade do preenchimento no CFD: WIP em destaque, etapas terminais suavizadas. */
export function getFlowCfdFillOpacity(etapa: string): number {
  return isWipEtapa(etapa) ? FLOW_CFD_WIP_FILL_OPACITY : FLOW_CFD_TERMINAL_FILL_OPACITY;
}

/** Ordem de empilhamento no CFD (base → topo). */
export function orderCfdEtapasForStack(etapas: readonly string[]): FlowEtapa[] {
  const selected = new Set(etapas);
  return FLOW_CFD_ETAPAS.filter((etapa) => selected.has(etapa));
}

/** Ordem visual de cima para baixo (legenda e tooltip). */
export function orderCfdEtapasForDisplay(etapas: readonly string[]): FlowEtapa[] {
  return [...orderCfdEtapasForStack(etapas)].reverse();
}
