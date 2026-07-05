/**
 * Padrão de drill-down do dashboard → listagem `/issues` (nova aba).
 *
 * - Montar URLs com `buildIssuesHref` / helpers abaixo (preservam filtros globais).
 * - Exibir contagens com `IssueCountLink` ou `KpiCard` (`issuesHref` + `issueCount`).
 * - Link só quando count > 0 (exceto KPIs sem contagem bruta explícita).
 */

import { filtersToSearchParams } from "@/lib/dashboard/filters";
import {
  type AggregateDimension,
  type AlertaDimensao,
  NAO_INFORMADO,
  OUTROS,
  TODOS,
} from "@/lib/dashboard/constants";
import { issueStatusFilterValue } from "@/lib/dashboard/issue-status";
import type { FlowReportFilters } from "@/lib/dashboard/flow-report-params";
import type {
  MilestoneDeliveryDimension,
  MilestoneDeliveryDrilldownContext,
  MilestoneDeliveryMetric,
} from "@/lib/dashboard/milestone-delivery";
import { milestoneDeliveryDimensionToAggregate } from "@/lib/dashboard/milestone-delivery";
import type { MilestoneRoadmapGroupBy } from "@/lib/dashboard/milestone-roadmap";
import type { DashboardFilters } from "@/types/database";

/** Presets de KPI reutilizados em Executivo, Qualidade e Sprint. */
export type KpiIssuesPreset =
  | "total"
  | "abertas"
  | "fechadas"
  | "bugs_abertos"
  | "melhorias_abertas"
  | "sem_tipo"
  | "sla_acima_90";

const AGGREGATE_TO_FILTER: Partial<Record<AggregateDimension, keyof DashboardFilters>> = {
  status: "status",
  tipo: "tipo",
  prioridade: "prioridade",
  modulo: "modulo",
  equipe: "equipe",
  parceria: "parceria",
  repositorio: "repositorio",
  area_funcional: "area",
};

type QueryBase = URLSearchParams | string | DashboardFilters;

function toSearchParams(base: QueryBase): URLSearchParams {
  if (base instanceof URLSearchParams) return new URLSearchParams(base.toString());
  if (typeof base === "string") return new URLSearchParams(base);
  return filtersToSearchParams(base);
}

/** Monta URL de /issues preservando filtros globais. */
export function buildIssuesHref(
  base: QueryBase,
  extra?: Record<string, string | null | undefined>,
): string {
  const params = toSearchParams(base);
  params.delete("page");

  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value === null || value === undefined || value === "" || value === TODOS) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
  }

  const query = params.toString();
  return query ? `/issues?${query}` : "/issues";
}

function moduloFromAlertaRow(modulo: string): string | undefined {
  if (modulo === OUTROS) return NAO_INFORMADO;
  return modulo;
}

/** Drill-down: alertas sem épico/parceria agrupados por módulo. */
export function buildAlertasPorModuloIssuesHref(
  base: QueryBase,
  dimensao: AlertaDimensao,
  modulo: string,
): string {
  const extra: Record<string, string> = { estado: "open" };
  const mod = moduloFromAlertaRow(modulo);
  if (mod) extra.modulo = mod;
  if (dimensao === "sem_epico") extra.epico = NAO_INFORMADO;
  else extra.parceria = NAO_INFORMADO;
  return buildIssuesHref(base, extra);
}

/** Drill-down: issues abertas em uma faixa de idade (Alertas). */
export function buildFaixaIdadeIssuesHref(base: QueryBase, faixa: string): string {
  return buildIssuesHref(base, {
    estado: "open",
    faixaIdade: faixa,
  });
}

/** Drill-down: cards de resumo em Alertas. */
export function buildAlertasResumoIssuesHref(
  base: QueryBase,
  tipo: "abertas" | "sem_epico" | "sem_parceria",
): string {
  const extra: Record<string, string> = { estado: "open" };
  if (tipo === "sem_epico") extra.epico = NAO_INFORMADO;
  if (tipo === "sem_parceria") extra.parceria = NAO_INFORMADO;
  return buildIssuesHref(base, extra);
}

/** Normaliza rótulo de agregação para valor de filtro na listagem. */
export function aggregateLabelToFilterValue(
  label: string,
  dimension?: AggregateDimension,
): string {
  const base = label === OUTROS ? NAO_INFORMADO : label;
  if (dimension === "status") return issueStatusFilterValue(base);
  return base;
}

/** Drill-down: barra/fatia de gráfico ou linha de tabela por dimensão. */
export function buildAggregateIssuesHref(
  base: QueryBase,
  dimension: AggregateDimension,
  label: string,
  extra?: Record<string, string | null | undefined>,
): string | null {
  const filterKey = AGGREGATE_TO_FILTER[dimension];
  if (!filterKey) return null;
  return buildIssuesHref(base, {
    ...extra,
    [filterKey]: aggregateLabelToFilterValue(label, dimension),
  });
}

/** Drill-down: KPIs numéricos padronizados (Executivo, Qualidade, Sprint). */
export function buildKpiIssuesHref(base: QueryBase, preset: KpiIssuesPreset): string {
  switch (preset) {
    case "total":
      return buildIssuesHref(base);
    case "abertas":
      return buildIssuesHref(base, { estado: "open" });
    case "fechadas":
      return buildIssuesHref(base, { estado: "closed" });
    case "bugs_abertos":
      return buildIssuesHref(base, { estado: "open", tipo: "Bug" });
    case "melhorias_abertas":
      return buildIssuesHref(base, { estado: "open", tipo: "Melhoria" });
    case "sem_tipo":
      return buildIssuesHref(base, { tipo: NAO_INFORMADO });
    case "sla_acima_90":
      return buildIssuesHref(base, { estado: "open", sla: "acima_90" });
  }
}

/** Drill-down: entregas de módulo/épico no intervalo de uma sprint (roadmap PMO). */
export function buildMilestoneRoadmapIssuesHref(
  milestone: MilestoneDeliveryDrilldownContext,
  groupBy: MilestoneRoadmapGroupBy,
  label: string,
): string | null {
  const filterKey = groupBy === "epico" ? "epico" : "modulo";

  const extra: Record<string, string> = {
    estado: "closed",
    [filterKey]: aggregateLabelToFilterValue(label),
  };

  if (milestone.titulo?.trim()) {
    extra.sprint = milestone.titulo.trim();
  }
  if (milestone.start_date) extra.fechadoDe = milestone.start_date;
  if (milestone.due_date) extra.fechadoAte = milestone.due_date;

  return buildIssuesHref(new URLSearchParams(), extra);
}

/** Drill-down: entrega/WIP por dimensão no recorte de uma milestone. */
export function buildMilestoneDeliveryIssuesHref(
  milestone: MilestoneDeliveryDrilldownContext,
  dimension: MilestoneDeliveryDimension,
  label: string,
  metric: MilestoneDeliveryMetric,
): string | null {
  const extra: Record<string, string> = {
    estado: metric === "entregues" ? "closed" : "open",
  };

  if (milestone.titulo?.trim()) {
    extra.sprint = milestone.titulo.trim();
  }

  if (metric === "entregues") {
    if (milestone.start_date) extra.fechadoDe = milestone.start_date;
    if (milestone.due_date) extra.fechadoAte = milestone.due_date;
  }

  const aggregateDimension = milestoneDeliveryDimensionToAggregate(dimension);
  if (aggregateDimension) {
    return buildIssuesHref(new URLSearchParams(), {
      ...extra,
      [AGGREGATE_TO_FILTER[aggregateDimension]!]: aggregateLabelToFilterValue(
        label,
        aggregateDimension,
      ),
    });
  }

  if (dimension === "assignee" && label && label !== NAO_INFORMADO) {
    return buildIssuesHref(new URLSearchParams(), { ...extra, q: label });
  }

  return buildIssuesHref(new URLSearchParams(), extra);
}

/** Drill-down: issues concluídas ou abertas no recorte temporal do fluxo. */
export function buildFlowPeriodIssuesHref(
  filters: FlowReportFilters,
  estado: "open" | "closed",
): string {
  const extra: Record<string, string> = { estado };
  if (estado === "closed") {
    if (filters.startDate) extra.fechadoDe = filters.startDate;
    if (filters.endDate) extra.fechadoAte = filters.endDate;
  }
  return buildIssuesHref(filters, extra);
}
