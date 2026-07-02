import { TODOS } from "@/lib/dashboard/constants";
import { defaultFlowDateRange } from "@/lib/dashboard/flow-charts";
import { parseFilters } from "@/lib/dashboard/filters";
import type { DashboardSearchParams } from "@/lib/dashboard/page";
import type { DashboardFilters } from "@/types/database";

export type FlowReportFilters = DashboardFilters & {
  assignee: string;
  startDate: string | null;
  endDate: string | null;
  /** project_id na API → repositorio/gitlab_repo na base */
  projectId: string | null;
  /** milestone na API → sprint na base */
  milestone: string | null;
  /** module na API → modulo na base */
  module: string | null;
};

export type FlowGranularity = "week" | "month";

const DEFAULT_FLOW_FILTERS: FlowReportFilters = {
  modulo: TODOS,
  area: TODOS,
  tipo: TODOS,
  prioridade: TODOS,
  equipe: TODOS,
  status: TODOS,
  parceria: TODOS,
  sprint: TODOS,
  epico: TODOS,
  repositorio: TODOS,
  situacao: TODOS,
  ano: null,
  criadoDe: null,
  criadoAte: null,
  fechadoDe: null,
  fechadoAte: null,
  assignee: TODOS,
  startDate: null,
  endDate: null,
  projectId: null,
  milestone: null,
  module: null,
};

function strOr(value: string | null | undefined, fallback = TODOS): string {
  if (!value || value === "") return fallback;
  return value;
}

function dateOr(value: string | null | undefined): string | null {
  if (!value || value === "") return null;
  return value;
}

/** Converte query string da API REST para filtros internos + RPC. */
export function parseFlowReportParams(
  searchParams: URLSearchParams,
): FlowReportFilters {
  const base = parseFilters(Object.fromEntries(searchParams.entries()));

  const projectId = searchParams.get("project_id");
  const milestone = searchParams.get("milestone");
  const moduleName = searchParams.get("module");

  return {
    ...base,
    assignee: strOr(searchParams.get("assignee") ?? undefined),
    startDate: dateOr(searchParams.get("start_date") ?? undefined),
    endDate: dateOr(searchParams.get("end_date") ?? undefined),
    projectId: projectId && projectId !== TODOS ? projectId : null,
    milestone: milestone && milestone !== TODOS ? milestone : null,
    module: moduleName && moduleName !== TODOS ? moduleName : null,
    modulo: moduleName && moduleName !== TODOS ? moduleName : base.modulo,
    sprint: milestone && milestone !== TODOS ? milestone : base.sprint,
    repositorio:
      projectId && projectId !== TODOS ? projectId : base.repositorio,
  };
}

export function flowRpcScopeArgs(filters: FlowReportFilters) {
  return {
    p_modulo: filters.modulo,
    p_area: filters.area,
    p_tipo: filters.tipo,
    p_prioridade: filters.prioridade,
    p_equipe: filters.equipe,
    p_status: filters.status,
    p_parceria: filters.parceria,
    p_sprint: filters.sprint,
    p_epico: filters.epico,
    p_repositorio: filters.repositorio,
    p_situacao: filters.situacao,
    p_ano: filters.ano,
    p_assignee: filters.assignee,
  };
}

/** Filtros com período — RPCs CFD, throughput e lead time. */
export function flowRpcArgs(filters: FlowReportFilters) {
  return {
    ...flowRpcScopeArgs(filters),
    p_start_date: filters.startDate,
    p_end_date: filters.endDate,
  };
}

export function buildFlowReportFiltersMeta(filters: FlowReportFilters) {
  return {
    project_id: filters.projectId ?? filters.repositorio,
    module: filters.module ?? (filters.modulo !== TODOS ? filters.modulo : null),
    milestone: filters.milestone ?? (filters.sprint !== TODOS ? filters.sprint : null),
    assignee: filters.assignee !== TODOS ? filters.assignee : null,
    start_date: filters.startDate,
    end_date: filters.endDate,
    modulo: filters.modulo !== TODOS ? filters.modulo : null,
    area: filters.area !== TODOS ? filters.area : null,
    tipo: filters.tipo !== TODOS ? filters.tipo : null,
    repositorio: filters.repositorio !== TODOS ? filters.repositorio : null,
  };
}

export function parseFlowGranularity(value: string | null): FlowGranularity {
  return value === "month" ? "month" : "week";
}

/** Filtros da página /fluxo com período padrão (últimos 60 dias). */
function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Período anterior com a mesma duração (inclusive) imediatamente antes do recorte atual. */
export function shiftFlowPeriod(filters: FlowReportFilters): FlowReportFilters | null {
  if (!filters.startDate || !filters.endDate) return null;

  const start = parseIsoDate(filters.startDate);
  const end = parseIsoDate(filters.endDate);
  if (start > end) return null;

  const durationDays = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  const previousEnd = new Date(start);
  previousEnd.setDate(previousEnd.getDate() - 1);

  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousStart.getDate() - (durationDays - 1));

  return {
    ...filters,
    startDate: formatIsoDate(previousStart),
    endDate: formatIsoDate(previousEnd),
  };
}

export function resolveFlowPageFilters(searchParams: DashboardSearchParams): FlowReportFilters {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
  }

  const filters = parseFlowReportParams(params);
  const defaults = defaultFlowDateRange();

  return {
    ...filters,
    startDate: filters.startDate ?? defaults.startDate,
    endDate: filters.endDate ?? defaults.endDate,
  };
}

export { DEFAULT_FLOW_FILTERS };
