import type { PeriodoTipo } from "@/lib/dashboard/constants";
import { mergeadasSixMonthWindow, periodKeyToMergeRange } from "@/lib/dashboard/issuesLinks";
import { lastMonthsKeys } from "@/lib/dashboard/mergeadas-format";
import {
  formatPeriodSummaryShort,
  hasActiveGlobalPeriodFilter,
  resolvePeriodDates,
} from "@/lib/dashboard/period-filter";
import type { DashboardFilters, MergeadaPivotRow } from "@/types/database";

/** Rótulos do tipo de data no filtro global (legenda da tabela). */
const PERIODO_TIPO_DATA_LABELS: Record<PeriodoTipo, string> = {
  criacao: "Data de criação",
  fechamento: "Data de fechamento",
  merge: "Data de merge",
};

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

/** Linha do pivô: rótulo + valores por período (mês) + total do período. */
export type MergeadaPivotLinha = { linha: string; cols: Map<string, number>; total: number };

/** Ordena por total desc e, no empate, alfabético pt-BR. */
export function comparePivotLinhasPorTotal(a: MergeadaPivotLinha, b: MergeadaPivotLinha): number {
  return b.total - a.total || a.linha.localeCompare(b.linha, "pt-BR");
}

/**
 * Monta as linhas do pivô a partir das linhas cruas (linha/periodo/total),
 * somando o total dentro dos `periodos` informados. Reaproveitado por tela,
 * Excel, Word e impressão para evitar duplicação da matriz.
 */
export function buildPivotLinhas(
  pivot: MergeadaPivotRow[],
  periodos: string[],
  compare: (a: MergeadaPivotLinha, b: MergeadaPivotLinha) => number = comparePivotLinhasPorTotal,
): MergeadaPivotLinha[] {
  const matrix = new Map<string, Map<string, number>>();
  for (const row of pivot) {
    if (!matrix.has(row.linha)) matrix.set(row.linha, new Map());
    matrix.get(row.linha)!.set(row.periodo, row.total);
  }
  return Array.from(matrix.entries())
    .map(([linha, cols]) => ({
      linha,
      cols,
      total: periodos.reduce((acc, p) => acc + (cols.get(p) ?? 0), 0),
    }))
    .sort(compare);
}

/** Totais por período (coluna) somando todas as linhas. */
export function pivotPeriodTotals(linhas: MergeadaPivotLinha[], periodos: string[]): number[] {
  return periodos.map((p) => linhas.reduce((acc, l) => acc + (l.cols.get(p) ?? 0), 0));
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

/** Resumo do filtro global para a legenda (ex.: "Data de fechamento · 01/02/2026 – 29/07/2026"). */
export function mergeadasPivotPeriodFilterLabel(
  filters: DashboardFilters,
): string | null {
  if (!hasActiveGlobalPeriodFilter(filters)) return null;
  return formatPeriodSummaryShort(filters, PERIODO_TIPO_DATA_LABELS);
}

/** Legenda da tabela: dimensão ativa + recorte (últimos 6 meses ou filtro global). */
export function mergeadasPivotSubtitle(
  filters: DashboardFilters,
  dimensao: MergeadasPivotDimensao,
): string {
  const linha = mergeadasPivotDimensaoLabel(dimensao).toLowerCase();
  const base = `Contagem por ${linha} e mês do merge`;
  const periodo = mergeadasPivotPeriodFilterLabel(filters);
  if (!periodo) {
    return `${base} (últimos 6 meses)`;
  }
  return `${base} (Filtro aplicado: ${periodo})`;
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
