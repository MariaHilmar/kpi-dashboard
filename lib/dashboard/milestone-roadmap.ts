import type { MilestoneOption } from "@/lib/dashboard/milestone-options";

import { MILESTONE_DELIVERY_ANTI_PUNITIVE_NOTE } from "./milestone-delivery";

export type MilestoneRoadmapGroupBy = "modulo" | "epico";

export type MilestoneRoadmapMetric = "pontos" | "issues";

export type MilestoneRoadmapRow = {
  milestone_iid: number;
  milestone_titulo: string;
  milestone_start_date: string | null;
  milestone_due_date: string | null;
  label: string;
  rank_in_sprint: number;
  entregues: number;
  pontos_entregues: number;
};

export type MilestoneRoadmapSprintCell = {
  milestone_iid: number;
  milestone_titulo: string;
  items: {
    label: string;
    rank: number;
    entregues: number;
    pontos_entregues: number;
    value: number;
  }[];
  totalEntregues: number;
  totalPontos: number;
};

export type MilestoneRoadmapTimeline = {
  sprints: {
    milestone_iid: number;
    label: string;
    titulo: string;
    cell: MilestoneRoadmapSprintCell;
  }[];
  maxCellValue: number;
};

export type MilestoneRoadmapLinePoint = {
  milestone_iid: number;
  label: string;
  titulo: string;
  value: number;
  entregues: number;
  pontos_entregues: number;
};

export const DEFAULT_MILESTONE_ROADMAP_FROM_IID = 37;

export const DEFAULT_MILESTONE_ROADMAP_TOP_N = 5;

export const MILESTONE_ROADMAP_TOP_N_OPTIONS = [3, 5, 8, 10] as const;

export const MILESTONE_ROADMAP_GROUP_LABELS: Record<MilestoneRoadmapGroupBy, string> = {
  modulo: "Módulo",
  epico: "Épico",
};

export const MILESTONE_ROADMAP_ANTI_PUNITIVE_NOTE = MILESTONE_DELIVERY_ANTI_PUNITIVE_NOTE;

export function parseMilestoneRoadmapGroupBy(
  raw: string | null | undefined,
): MilestoneRoadmapGroupBy {
  return raw === "epico" ? "epico" : "modulo";
}

export function parseMilestoneRoadmapMetric(
  raw: string | null | undefined,
): MilestoneRoadmapMetric {
  return raw === "issues" ? "issues" : "pontos";
}

export function parseMilestoneRoadmapTopN(raw: string | null | undefined): number {
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) return DEFAULT_MILESTONE_ROADMAP_TOP_N;
  return Math.min(value, 20);
}

export function resolveMilestoneRoadmapRange(
  milestones: MilestoneOption[],
  fromRaw: string | null | undefined,
  toRaw: string | null | undefined,
): { fromIid: number; toIid: number } | null {
  const iids = milestones
    .map((m) => m.gitlab_milestone_iid)
    .filter((iid): iid is number => iid != null)
    .sort((a, b) => a - b);

  if (iids.length === 0) return null;

  const maxIid = iids[iids.length - 1]!;
  const minIid = iids[0]!;

  const parsedFrom = Number(fromRaw);
  const parsedTo = Number(toRaw);

  let fromIid =
    Number.isInteger(parsedFrom) && parsedFrom > 0
      ? parsedFrom
      : Math.max(minIid, DEFAULT_MILESTONE_ROADMAP_FROM_IID);

  let toIid = Number.isInteger(parsedTo) && parsedTo > 0 ? parsedTo : maxIid;

  if (fromIid > toIid) [fromIid, toIid] = [toIid, fromIid];

  fromIid = Math.max(fromIid, minIid);
  toIid = Math.min(toIid, maxIid);

  if (fromIid > toIid) return null;

  return { fromIid, toIid };
}

function metricValue(
  row: Pick<MilestoneRoadmapRow, "entregues" | "pontos_entregues">,
  metric: MilestoneRoadmapMetric,
): number {
  return metric === "issues" ? row.entregues : row.pontos_entregues;
}

export function milestoneRoadmapHasStoryPoints(rows: MilestoneRoadmapRow[]): boolean {
  return rows.some((row) => row.pontos_entregues > 0);
}

export function milestoneRoadmapUniqueLabels(rows: MilestoneRoadmapRow[]): string[] {
  const totals = new Map<string, number>();

  for (const row of rows) {
    totals.set(row.label, (totals.get(row.label) ?? 0) + row.entregues + row.pontos_entregues);
  }

  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"))
    .map(([label]) => label);
}

export function parseMilestoneRoadmapLabel(
  raw: string | null | undefined,
  labels: string[],
): string | null {
  if (!raw) return labels[0] ?? null;
  return labels.includes(raw) ? raw : labels[0] ?? null;
}

export function milestoneRoadmapToTimeline(
  rows: MilestoneRoadmapRow[],
  metric: MilestoneRoadmapMetric,
): MilestoneRoadmapTimeline {
  const sprintMap = new Map<number, MilestoneRoadmapSprintCell>();
  let maxCellValue = 0;

  for (const row of rows) {
    let cell = sprintMap.get(row.milestone_iid);
    if (!cell) {
      cell = {
        milestone_iid: row.milestone_iid,
        milestone_titulo: row.milestone_titulo,
        items: [],
        totalEntregues: 0,
        totalPontos: 0,
      };
      sprintMap.set(row.milestone_iid, cell);
    }

    const value = metricValue(row, metric);
    maxCellValue = Math.max(maxCellValue, value);

    cell.items.push({
      label: row.label,
      rank: row.rank_in_sprint,
      entregues: row.entregues,
      pontos_entregues: row.pontos_entregues,
      value,
    });
    cell.totalEntregues += row.entregues;
    cell.totalPontos += row.pontos_entregues;
  }

  const sprints = [...sprintMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([milestone_iid, cell]) => ({
      milestone_iid,
      label: String(milestone_iid),
      titulo: cell.milestone_titulo,
      cell,
    }));

  for (const sprint of sprints) {
    sprint.cell.items.sort((a, b) => a.rank - b.rank);
  }

  return { sprints, maxCellValue };
}

export function milestoneRoadmapToLineSeries(
  rows: MilestoneRoadmapRow[],
  label: string | null,
  metric: MilestoneRoadmapMetric,
): MilestoneRoadmapLinePoint[] {
  if (!label) return [];

  const bySprint = new Map<number, MilestoneRoadmapLinePoint>();

  for (const row of rows) {
    if (row.label !== label) continue;

    bySprint.set(row.milestone_iid, {
      milestone_iid: row.milestone_iid,
      label: String(row.milestone_iid),
      titulo: row.milestone_titulo,
      value: metricValue(row, metric),
      entregues: row.entregues,
      pontos_entregues: row.pontos_entregues,
    });
  }

  return [...bySprint.values()].sort((a, b) => a.milestone_iid - b.milestone_iid);
}

/** Intensidade 0–1 para barra dentro da célula da timeline. */
export function milestoneRoadmapBarIntensity(value: number, maxValue: number): number {
  if (maxValue <= 0 || value <= 0) return 0;
  return Math.min(1, value / maxValue);
}
