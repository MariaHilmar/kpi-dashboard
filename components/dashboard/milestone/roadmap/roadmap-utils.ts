import type {
  MilestoneRoadmapMetric,
  MilestoneRoadmapRow,
} from "@/lib/dashboard/milestone-roadmap";

export type SprintDatesMap = Map<
  number,
  { start_date: string | null; due_date: string | null }
>;

export function buildSprintDatesMap(rows: MilestoneRoadmapRow[]): SprintDatesMap {
  const sprintDates: SprintDatesMap = new Map();

  for (const row of rows) {
    if (!sprintDates.has(row.milestone_iid)) {
      sprintDates.set(row.milestone_iid, {
        start_date: row.milestone_start_date,
        due_date: row.milestone_due_date,
      });
    }
  }

  return sprintDates;
}

export function roadmapLabelOptions(rows: MilestoneRoadmapRow[]): string[] {
  return [...new Set(rows.map((row) => row.label))].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export function getRoadmapMetricLabel(metric: MilestoneRoadmapMetric): string {
  return metric === "issues" ? "Issues entregues" : "Story points entregues";
}
