import type { FluxoMensal } from "@/types/database";

export const EVOLUCAO_MENSAL_WINDOWS = [
  { id: "6m", label: "6 meses", months: 6 },
  { id: "1y", label: "1 ano", months: 12 },
  { id: "2y", label: "2 anos", months: 24 },
] as const;

export type EvolucaoMensalWindow = (typeof EVOLUCAO_MENSAL_WINDOWS)[number]["id"];

export const DEFAULT_EVOLUCAO_MENSAL_WINDOW: EvolucaoMensalWindow = "1y";

export const EVOLUCAO_MENSAL_WINDOW_PARAM = "evolucaoJanela";

export function parseEvolucaoMensalWindow(value: string | null | undefined): EvolucaoMensalWindow {
  if (value && EVOLUCAO_MENSAL_WINDOWS.some((window) => window.id === value)) {
    return value as EvolucaoMensalWindow;
  }
  return DEFAULT_EVOLUCAO_MENSAL_WINDOW;
}

export function monthsForEvolucaoMensalWindow(window: EvolucaoMensalWindow): number {
  return EVOLUCAO_MENSAL_WINDOWS.find((item) => item.id === window)?.months ?? 12;
}

/** Mantém os últimos N meses da série (ordenada por `mes` YYYY/MM). */
export function filterFluxoMensalByWindow(
  data: FluxoMensal[],
  window: EvolucaoMensalWindow,
): FluxoMensal[] {
  if (data.length === 0) return data;

  const months = monthsForEvolucaoMensalWindow(window);
  const sorted = [...data].sort((a, b) => a.mes.localeCompare(b.mes));
  if (sorted.length <= months) return sorted;
  return sorted.slice(-months);
}
