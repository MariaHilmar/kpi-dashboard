import type { MilestoneBurndownRow } from "@/lib/dashboard/milestone-aggregates";
import type { MilestoneDetail } from "@/lib/dashboard/milestone-report";

export type MilestoneBurndownMetric = "issues" | "pontos";
export type MilestoneBurndownGranularity = "day" | "week";

export type MilestoneBurndownChartPoint = {
  snapshot_date: string;
  label: string;
  remaining: number;
  done: number;
  committed: number;
  ideal: number | null;
  pctDelivered: number;
  source: MilestoneBurndownRow["source"];
};

export type LastMinuteDeliveryKpi = {
  midpointPct: number | null;
  lastWeekPct: number | null;
  lastMinuteIndex: number | null;
  midpointDate: string | null;
  lastWeekStart: string | null;
};

export type MilestoneBurndownSprintCompare = {
  milestoneIid: number;
  pctSeries: { snapshot_date: string; pctDelivered: number }[];
  kpi: LastMinuteDeliveryKpi;
};

const DAY_MS = 86_400_000;

export function parseMilestoneBurndownMetric(
  raw: string | null | undefined,
): MilestoneBurndownMetric {
  return raw === "issues" ? "issues" : "pontos";
}

export function parseMilestoneBurndownGranularity(
  raw: string | null | undefined,
): MilestoneBurndownGranularity {
  return raw === "week" ? "week" : "day";
}

function parseIsoDate(value: string): Date | null {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function diffDays(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / DAY_MS);
}

function metricValues(row: MilestoneBurndownRow, metric: MilestoneBurndownMetric) {
  const committed =
    metric === "issues" ? row.issues_committed : row.points_committed;
  const remaining = metric === "issues" ? row.issues_open : row.points_remaining;
  const done = metric === "issues" ? row.issues_done : row.points_done;
  const idealFromRpc = metric === "issues" ? null : row.points_ideal;

  return { committed, remaining, done, idealFromRpc };
}

export function computeIdealRemaining(
  committed: number,
  startDate: string | null,
  dueDate: string | null,
  snapshotDate: string,
): number | null {
  if (!startDate || !dueDate || committed <= 0) return null;

  const start = parseIsoDate(startDate);
  const end = parseIsoDate(dueDate);
  const current = parseIsoDate(snapshotDate);
  if (!start || !end || !current || end <= start) return null;

  const totalDays = diffDays(start, end);
  if (totalDays <= 0) return null;

  const daysRemaining = diffDays(current, end);
  return Math.round(committed * Math.max(0, daysRemaining / totalDays) * 100) / 100;
}

function formatDayLabel(snapshotDate: string): string {
  const date = parseIsoDate(snapshotDate);
  if (!date) return snapshotDate;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function formatWeekLabel(snapshotDate: string): string {
  const date = parseIsoDate(snapshotDate);
  if (!date) return snapshotDate;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function pctDelivered(done: number, committed: number): number {
  if (committed <= 0) return 0;
  return Math.round((done / committed) * 1000) / 10;
}

export function milestoneBurndownToChartSeries(
  rows: MilestoneBurndownRow[],
  metric: MilestoneBurndownMetric,
  milestone: Pick<MilestoneDetail, "start_date" | "due_date">,
  granularity: MilestoneBurndownGranularity = "day",
): MilestoneBurndownChartPoint[] {
  if (rows.length === 0) return [];

  const daily = rows.map((row) => {
    const { committed, remaining, done, idealFromRpc } = metricValues(row, metric);
    const ideal =
      idealFromRpc ??
      computeIdealRemaining(
        committed,
        milestone.start_date,
        milestone.due_date,
        row.snapshot_date,
      );

    return {
      snapshot_date: row.snapshot_date,
      label: formatDayLabel(row.snapshot_date),
      remaining,
      done,
      committed,
      ideal,
      pctDelivered: pctDelivered(done, committed),
      source: row.source,
    };
  });

  if (granularity === "day") return daily;

  const byWeek = new Map<string, MilestoneBurndownChartPoint>();
  for (const point of daily) {
    const date = parseIsoDate(point.snapshot_date);
    if (!date) continue;
    const weekStart = addDays(date, -((date.getDay() + 6) % 7));
    const key = formatIsoDate(weekStart);
    byWeek.set(key, {
      ...point,
      label: formatWeekLabel(point.snapshot_date),
    });
  }

  return [...byWeek.values()].sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date));
}

function findRowOnOrBefore(
  rows: MilestoneBurndownRow[],
  targetDate: string,
): MilestoneBurndownRow | null {
  let match: MilestoneBurndownRow | null = null;
  for (const row of rows) {
    if (row.snapshot_date <= targetDate) match = row;
    else break;
  }
  return match;
}

export function computeLastMinuteDeliveryKpi(
  rows: MilestoneBurndownRow[],
  metric: MilestoneBurndownMetric,
  startDate: string | null,
  dueDate: string | null,
): LastMinuteDeliveryKpi {
  const empty: LastMinuteDeliveryKpi = {
    midpointPct: null,
    lastWeekPct: null,
    lastMinuteIndex: null,
    midpointDate: null,
    lastWeekStart: null,
  };

  if (rows.length === 0 || !startDate || !dueDate) return empty;

  const start = parseIsoDate(startDate);
  const end = parseIsoDate(dueDate);
  if (!start || !end || end <= start) return empty;

  const committed =
    metric === "issues" ? rows[0]!.issues_committed : rows[0]!.points_committed;
  if (committed <= 0) return empty;

  const totalDays = diffDays(start, end);
  const midpointDate = formatIsoDate(addDays(start, Math.floor(totalDays / 2)));
  const lastWeekStart = formatIsoDate(addDays(end, -6));

  const midpointRow = findRowOnOrBefore(rows, midpointDate);
  const beforeLastWeekRow = findRowOnOrBefore(rows, formatIsoDate(addDays(parseIsoDate(lastWeekStart)!, -1)));
  const finalRow = rows[rows.length - 1]!;

  const doneAtMidpoint =
    metric === "issues"
      ? (midpointRow?.issues_done ?? 0)
      : (midpointRow?.points_done ?? 0);
  const doneBeforeLastWeek =
    metric === "issues"
      ? (beforeLastWeekRow?.issues_done ?? 0)
      : (beforeLastWeekRow?.points_done ?? 0);
  const doneFinal =
    metric === "issues" ? finalRow.issues_done : finalRow.points_done;

  const midpointPct = pctDelivered(doneAtMidpoint, committed);
  const lastWeekPct = pctDelivered(Math.max(0, doneFinal - doneBeforeLastWeek), committed);

  const lastMinuteIndex =
    midpointPct > 0 ? Math.round((lastWeekPct / midpointPct) * 100) / 100 : null;

  return {
    midpointPct,
    lastWeekPct,
    lastMinuteIndex,
    midpointDate,
    lastWeekStart,
  };
}

export function milestoneBurndownHasStoryPoints(rows: MilestoneBurndownRow[]): boolean {
  return rows.some((row) => row.points_committed > 0);
}

export function resolveBurndownCompareIids(
  currentIid: number,
  availableIids: number[],
  preferred: number[] = [89, 90, 91],
): number[] {
  const inData = preferred.filter((iid) => availableIids.includes(iid));
  if (inData.length > 0) return inData.sort((a, b) => a - b);

  const sorted = [...availableIids].sort((a, b) => a - b);
  const idx = sorted.indexOf(currentIid);
  if (idx === -1) return sorted.slice(-3);

  const start = Math.max(0, idx - 1);
  return sorted.slice(start, start + 3);
}

export function buildBurndownSprintCompare(
  milestoneIid: number,
  rows: MilestoneBurndownRow[],
  metric: MilestoneBurndownMetric,
  milestone: Pick<MilestoneDetail, "start_date" | "due_date">,
): MilestoneBurndownSprintCompare {
  const series = milestoneBurndownToChartSeries(rows, metric, milestone, "day");
  return {
    milestoneIid,
    pctSeries: series.map((point) => ({
      snapshot_date: point.snapshot_date,
      pctDelivered: point.pctDelivered,
    })),
    kpi: computeLastMinuteDeliveryKpi(
      rows,
      metric,
      milestone.start_date,
      milestone.due_date,
    ),
  };
}

export function lastMinuteIndexLabel(index: number | null): string {
  if (index == null) return "—";
  if (index >= 1.5) return "Entrega tardia";
  if (index >= 1) return "Acelerada no fim";
  return "Ritmo equilibrado";
}
