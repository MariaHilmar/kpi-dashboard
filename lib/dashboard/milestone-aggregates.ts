/**
 * Agregações de milestone — compõe /sprint (rótulos de dimensão) e /fluxo (etapas WIP)
 * no recorte `milestone_issues` + `gitlab_milestone_iid`, sem filtro `issues.sprint`.
 *
 * Espelha `dashboard_aggregate_v2` via `_milestone_dimension_label` (SQL) e
 * `flow-stages.ts` / `flow_resolve_etapa_on_date` para WIP.
 */

import type { AggregateDimension } from "@/lib/dashboard/constants";
import { NAO_INFORMADO } from "@/lib/dashboard/constants";
import { formatIssueStatusDisplayLabel } from "@/lib/dashboard/issue-status";
import type { ChartPoint } from "@/types/database";

export type MilestoneMixSerie = "comprometido" | "entregue";

export type MilestoneMixRow = {
  serie: MilestoneMixSerie;
  label: string;
  quantidade: number;
};

export type MilestoneWipRow = {
  ref_date: string;
  etapa: string;
  quantidade: number;
  story_points: number;
};

export type MilestoneSummary = {
  ref_date: string | null;
  wip_issues: number;
  wip_story_points: number;
  committed_issues: number;
  committed_story_points: number;
  delivered_issues: number;
  delivered_story_points: number;
};

export type MilestoneBurndownSource = "snapshot" | "reconstructed";

export type MilestoneBurndownRow = {
  snapshot_date: string;
  points_remaining: number;
  issues_open: number;
  points_done: number;
  issues_done: number;
  points_committed: number;
  issues_committed: number;
  points_ideal: number | null;
  source: MilestoneBurndownSource;
};

/** Separa linhas de mix por série (comprometido / entregue). */
export function splitMilestoneMixBySerie(rows: MilestoneMixRow[]): {
  comprometido: MilestoneMixRow[];
  entregue: MilestoneMixRow[];
} {
  const comprometido: MilestoneMixRow[] = [];
  const entregue: MilestoneMixRow[] = [];

  for (const row of rows) {
    if (row.serie === "comprometido") comprometido.push(row);
    else entregue.push(row);
  }

  return { comprometido, entregue };
}

/** Converte mix RPC → ChartPoint[], com rótulo de status formatado como /sprint. */
export function milestoneMixToChartPoints(
  rows: MilestoneMixRow[],
  serie: MilestoneMixSerie,
  dimension: AggregateDimension,
): ChartPoint[] {
  return rows
    .filter((row) => row.serie === serie && row.quantidade > 0)
    .map((row) => {
      const rawLabel = row.label || NAO_INFORMADO;
      const label =
        dimension === "status" ? formatIssueStatusDisplayLabel(rawLabel) : rawLabel;
      return { label, quantidade: row.quantidade };
    })
    .sort((a, b) => b.quantidade - a.quantidade || a.label.localeCompare(b.label, "pt-BR"));
}

/** WIP por etapa → ChartPoint[] (mesmo formato de fetchFlowWip + BarChartCard). */
export function milestoneWipToChartPoints(rows: MilestoneWipRow[]): ChartPoint[] {
  return rows
    .filter((row) => row.quantidade > 0)
    .map((row) => ({ label: row.etapa, quantidade: row.quantidade }));
}

/** Agrupa equipe comprometido × entregue para gráfico de barras comparativo. */
export function milestoneMixToComparisonBars(
  rows: MilestoneMixRow[],
): { label: string; comprometido: number; entregue: number }[] {
  const byLabel = new Map<string, { comprometido: number; entregue: number }>();

  for (const row of rows) {
    const current = byLabel.get(row.label) ?? { comprometido: 0, entregue: 0 };
    if (row.serie === "comprometido") current.comprometido = row.quantidade;
    else current.entregue = row.quantidade;
    byLabel.set(row.label, current);
  }

  return [...byLabel.entries()]
    .map(([label, values]) => ({ label, ...values }))
    .sort(
      (a, b) =>
        b.comprometido + b.entregue - (a.comprometido + a.entregue) ||
        a.label.localeCompare(b.label, "pt-BR"),
    );
}

export function sumMilestoneMixSerie(rows: MilestoneMixRow[], serie: MilestoneMixSerie): number {
  return rows.filter((row) => row.serie === serie).reduce((sum, row) => sum + row.quantidade, 0);
}

export function sumMilestoneWip(rows: MilestoneWipRow[]): number {
  return rows.reduce((sum, row) => sum + row.quantidade, 0);
}

export function sumMilestoneWipStoryPoints(rows: MilestoneWipRow[]): number {
  return rows.reduce((sum, row) => sum + row.story_points, 0);
}

export function formatMilestoneWipRefLabel(refDate: string | null, dueDate: string | null): string {
  if (!refDate) return "Referência não definida";
  if (dueDate && refDate === dueDate) return `Snapshot em ${refDate} (fechamento)`;
  return `Snapshot em ${refDate} (hoje — milestone aberta)`;
}
