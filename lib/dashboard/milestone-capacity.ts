import type { MilestoneOption } from "@/lib/dashboard/milestone-options";

import { TODOS } from "@/lib/dashboard/constants";
import { sortFilterOptions } from "@/lib/dashboard/filters";
import { MILESTONE_DELIVERY_ANTI_PUNITIVE_NOTE } from "./milestone-delivery";

export type MilestoneCapacityMetric = "pontos" | "issues";

export type MilestoneCapacityRow = {
  milestone_iid: number;
  milestone_titulo: string;
  equipe: string;
  fechadas: number;
  entregues: number;
  pontos_entregues: number;
};

export type MilestoneCapacityHeatmapCell = {
  milestone_iid: number;
  equipe: string;
  value: number;
  fechadas: number;
  entregues: number;
  pontos_entregues: number;
  milestone_titulo: string;
};

export type MilestoneCapacityHeatmap = {
  teams: string[];
  sprints: { milestone_iid: number; label: string; titulo: string }[];
  cells: MilestoneCapacityHeatmapCell[];
  maxValue: number;
};

export type MilestoneCapacityLinePoint = {
  milestone_iid: number;
  label: string;
  titulo: string;
  value: number;
  fechadas: number;
  entregues: number;
  pontos_entregues: number;
};

export const DEFAULT_MILESTONE_CAPACITY_SPRINT_WINDOW = 12;

export const MILESTONE_CAPACITY_ANTI_PUNITIVE_NOTE = MILESTONE_DELIVERY_ANTI_PUNITIVE_NOTE;

export function parseMilestoneCapacityMetric(
  raw: string | null | undefined,
): MilestoneCapacityMetric {
  return raw === "issues" ? "issues" : "pontos";
}

export function resolveMilestoneCapacityRange(
  milestones: MilestoneOption[],
  fromRaw: string | null | undefined,
  toRaw: string | null | undefined,
  anchorIid?: number | null,
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
  const hasFrom = Number.isInteger(parsedFrom) && parsedFrom > 0;
  const hasTo = Number.isInteger(parsedTo) && parsedTo > 0;

  let fromIid: number;
  let toIid: number;

  if (!hasFrom && !hasTo && anchorIid != null && iids.includes(anchorIid)) {
    const anchorIdx = iids.indexOf(anchorIid);
    fromIid = iids[Math.max(0, anchorIdx - 1)]!;
    toIid = anchorIid;
  } else {
    fromIid = hasFrom
      ? parsedFrom
      : Math.max(minIid, maxIid - DEFAULT_MILESTONE_CAPACITY_SPRINT_WINDOW + 1);
    toIid = hasTo ? parsedTo : maxIid;
  }

  if (fromIid > toIid) [fromIid, toIid] = [toIid, fromIid];

  fromIid = Math.max(fromIid, minIid);
  toIid = Math.min(toIid, maxIid);

  if (fromIid > toIid) return null;

  return { fromIid, toIid };
}

export function parseMilestoneCapacityTeam(
  raw: string | null | undefined,
  teamOptions: string[],
): string {
  if (!raw || raw === TODOS) return TODOS;
  return teamOptions.includes(raw) ? raw : TODOS;
}

/** Opções do select de equipe — alinhadas ao filtro global + equipes com entrega no intervalo. */
export function milestoneCapacityTeamOptions(
  filterEquipes: string[],
  dataTeams: string[],
): string[] {
  const extra = dataTeams.filter((team) => !filterEquipes.includes(team));
  return sortFilterOptions([...filterEquipes, ...extra]);
}

function metricValue(row: MilestoneCapacityRow, metric: MilestoneCapacityMetric): number {
  return metric === "issues" ? row.fechadas : row.pontos_entregues;
}

export function milestoneCapacityMetricLabel(metric: MilestoneCapacityMetric): string {
  return metric === "issues" ? "Issues fechadas" : "Story points entregues";
}

/** Equipes individuais exibidas no heatmap (sem a linha de total). */
export function milestoneCapacityHeatmapTeamRows(teamOptions: string[]): string[] {
  return teamOptions.filter((team) => team !== TODOS);
}

export function milestoneCapacityHasStoryPoints(rows: MilestoneCapacityRow[]): boolean {
  return rows.some((row) => row.pontos_entregues > 0);
}

export function milestoneCapacityUniqueTeams(rows: MilestoneCapacityRow[]): string[] {
  const totals = new Map<string, number>();

  for (const row of rows) {
    totals.set(
      row.equipe,
      (totals.get(row.equipe) ?? 0) + row.fechadas + row.entregues + row.pontos_entregues,
    );
  }

  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"))
    .map(([equipe]) => equipe);
}

function emptyHeatmapCell(
  sprint: { milestone_iid: number; titulo: string },
  equipe: string,
): MilestoneCapacityHeatmapCell {
  return {
    milestone_iid: sprint.milestone_iid,
    equipe,
    value: 0,
    fechadas: 0,
    entregues: 0,
    pontos_entregues: 0,
    milestone_titulo: sprint.titulo,
  };
}

export function milestoneCapacityToHeatmap(
  rows: MilestoneCapacityRow[],
  metric: MilestoneCapacityMetric,
  teamOptions: string[],
): MilestoneCapacityHeatmap {
  const sprintMap = new Map<number, { label: string; titulo: string }>();
  const cellMap = new Map<string, MilestoneCapacityHeatmapCell>();

  for (const row of rows) {
    sprintMap.set(row.milestone_iid, {
      label: String(row.milestone_iid),
      titulo: row.milestone_titulo,
    });

    const key = `${row.milestone_iid}::${row.equipe}`;
    const value = metricValue(row, metric);
    const existing = cellMap.get(key);

    if (existing) {
      existing.value += value;
      existing.fechadas += row.fechadas;
      existing.entregues += row.entregues;
      existing.pontos_entregues += row.pontos_entregues;
    } else {
      cellMap.set(key, {
        milestone_iid: row.milestone_iid,
        equipe: row.equipe,
        value,
        fechadas: row.fechadas,
        entregues: row.entregues,
        pontos_entregues: row.pontos_entregues,
        milestone_titulo: row.milestone_titulo,
      });
    }
  }

  const sprints = [...sprintMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([milestone_iid, meta]) => ({ milestone_iid, ...meta }));

  const detailTeams = milestoneCapacityHeatmapTeamRows(teamOptions);
  const teams = [TODOS, ...detailTeams];

  const detailCellMap = new Map<string, MilestoneCapacityHeatmapCell>();
  for (const team of detailTeams) {
    for (const sprint of sprints) {
      const key = `${sprint.milestone_iid}::${team}`;
      detailCellMap.set(key, cellMap.get(key) ?? emptyHeatmapCell(sprint, team));
    }
  }

  const cells: MilestoneCapacityHeatmapCell[] = [];
  let maxValue = 0;

  for (const team of teams) {
    for (const sprint of sprints) {
      if (team === TODOS) {
        const total = emptyHeatmapCell(sprint, TODOS);
        for (const detailTeam of detailTeams) {
          const detail = detailCellMap.get(`${sprint.milestone_iid}::${detailTeam}`);
          if (!detail) continue;
          total.value += detail.value;
          total.fechadas += detail.fechadas;
          total.entregues += detail.entregues;
          total.pontos_entregues += detail.pontos_entregues;
        }
        cells.push(total);
        maxValue = Math.max(maxValue, total.value);
        continue;
      }

      const cell = detailCellMap.get(`${sprint.milestone_iid}::${team}`)!;
      cells.push(cell);
      maxValue = Math.max(maxValue, cell.value);
    }
  }

  return { teams, sprints, cells, maxValue };
}

export function milestoneCapacityToLineSeries(
  rows: MilestoneCapacityRow[],
  equipe: string,
  metric: MilestoneCapacityMetric,
  teamOptions?: string[],
): MilestoneCapacityLinePoint[] {
  if (equipe === TODOS && teamOptions && teamOptions.length > 0) {
    const heatmap = milestoneCapacityToHeatmap(rows, metric, teamOptions);
    return heatmap.sprints.map((sprint) => {
      const cell = heatmap.cells.find(
        (item) => item.equipe === TODOS && item.milestone_iid === sprint.milestone_iid,
      );
      return {
        milestone_iid: sprint.milestone_iid,
        label: String(sprint.milestone_iid),
        titulo: sprint.titulo,
        value: cell?.value ?? 0,
        fechadas: cell?.fechadas ?? 0,
        entregues: cell?.entregues ?? 0,
        pontos_entregues: cell?.pontos_entregues ?? 0,
      };
    });
  }

  const bySprint = new Map<number, MilestoneCapacityLinePoint>();

  for (const row of rows) {
    if (equipe !== TODOS && row.equipe !== equipe) continue;

    const value = metricValue(row, metric);
    const existing = bySprint.get(row.milestone_iid);

    if (existing) {
      existing.value += value;
      existing.fechadas += row.fechadas;
      existing.entregues += row.entregues;
      existing.pontos_entregues += row.pontos_entregues;
    } else {
      bySprint.set(row.milestone_iid, {
        milestone_iid: row.milestone_iid,
        label: String(row.milestone_iid),
        titulo: row.milestone_titulo,
        value,
        fechadas: row.fechadas,
        entregues: row.entregues,
        pontos_entregues: row.pontos_entregues,
      });
    }
  }

  return [...bySprint.values()].sort((a, b) => a.milestone_iid - b.milestone_iid);
}

/** Intensidade 0–1 para cor do heatmap (escala sequencial verde). */
export function milestoneCapacityHeatmapIntensity(value: number, maxValue: number): number {
  if (maxValue <= 0 || value <= 0) return 0;
  return Math.min(1, value / maxValue);
}
