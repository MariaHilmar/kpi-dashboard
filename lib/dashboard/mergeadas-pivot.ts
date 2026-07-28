import { mergeadasSixMonthWindow, periodKeyToMergeRange } from "@/lib/dashboard/issuesLinks";
import { lastMonthsKeys } from "@/lib/dashboard/mergeadas-format";
import { hasActiveGlobalPeriodFilter, resolvePeriodDates } from "@/lib/dashboard/period-filter";
import type { DashboardFilters } from "@/types/database";

export const MERGEADAS_PIVOT_DIMENSAO_PARAM = "mergeadasPor";

export const MERGEADAS_PIVOT_DIMENSOES = ["modulo", "epico", "parceria"] as const;

export type MergeadasPivotDimensao = (typeof MERGEADAS_PIVOT_DIMENSOES)[number];

export const DEFAULT_MERGEADAS_PIVOT_DIMENSAO: MergeadasPivotDimensao = "epico";

const MERGEADAS_PIVOT_DIMENSAO_LABELS: Record<MergeadasPivotDimensao, string> = {
  modulo: "Módulo",
  epico: "Épico",
  parceria: "Parceria",
};

export function parseMergeadasPivotDimensao(
  value: string | string[] | null | undefined,
): MergeadasPivotDimensao {
  if (value === "modulo") return "modulo";
  if (value === "parceria") return "parceria";
  if (value === "epico") return "epico";
  return DEFAULT_MERGEADAS_PIVOT_DIMENSAO;
}

export function isMergeadasPivotPorModulo(dimensao: MergeadasPivotDimensao): boolean {
  return dimensao === "modulo";
}

/** Rótulo da coluna/linha para a dimensão selecionada (Módulo, Épico ou Parceria). */
export function mergeadasPivotDimensaoLabel(dimensao: MergeadasPivotDimensao): string {
  return MERGEADAS_PIVOT_DIMENSAO_LABELS[dimensao];
}

function monthKeysFromIsoRange(de: string, ate: string): string[] {
  const [startY, startM] = de.split("-").map(Number);
  const [endY, endM] = ate.split("-").map(Number);
  const keys: string[] = [];

  let year = startY;
  let month = startM;

  while (year < endY || (year === endY && month <= endM)) {
    keys.push(`${year}/${String(month).padStart(2, "0")}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return keys;
}

function resolvedPeriodIsoBounds(filters: DashboardFilters): { de: string; ate: string } | null {
  const resolved = resolvePeriodDates(filters);
  const de =
    resolved.criadoDe ??
    resolved.fechadoDe ??
    resolved.mergeadoDe ??
    (filters.ano != null ? `${filters.ano}-01-01` : null);
  const ate =
    resolved.criadoAte ??
    resolved.fechadoAte ??
    resolved.mergeadoAte ??
    (filters.ano != null ? `${filters.ano}-12-31` : null);

  if (!de && !ate) return null;
  return { de: de ?? ate!, ate: ate ?? de! };
}

/** Colunas YYYY/MM do pivô: últimos 6 meses ou meses do período global. */
export function mergeadasPivotPeriodKeys(
  filters: DashboardFilters,
  reference: Date = new Date(),
): string[] {
  if (!hasActiveGlobalPeriodFilter(filters)) {
    return lastMonthsKeys(6, reference);
  }

  const bounds = resolvedPeriodIsoBounds(filters);
  if (!bounds) return lastMonthsKeys(6, reference);
  return monthKeysFromIsoRange(bounds.de, bounds.ate);
}

export function mergeadasPivotTableTitle(filters: DashboardFilters): string {
  if (hasActiveGlobalPeriodFilter(filters)) {
    return "Mergeadas por período";
  }
  return "Mergeadas por período (últimos 6 meses)";
}

/** Intervalo de merge para drill-down do total do pivô. */
export function mergeadasPivotPeriodWindow(
  filters: DashboardFilters,
  reference: Date = new Date(),
): { mergeadoDe: string; mergeadoAte: string } {
  const keys = mergeadasPivotPeriodKeys(filters, reference);
  if (keys.length === 0) return mergeadasSixMonthWindow(reference);

  const first = periodKeyToMergeRange(keys[0]!);
  const last = periodKeyToMergeRange(keys[keys.length - 1]!);
  if (!first || !last) return mergeadasSixMonthWindow(reference);

  return {
    mergeadoDe: first.mergeadoDe,
    mergeadoAte: last.mergeadoAte,
  };
}
