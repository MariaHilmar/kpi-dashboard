import { FIBONACCI } from "@/lib/dashboard/planning-poker-import/constants";
import type { PlanningPokerRow } from "@/lib/dashboard/planning-poker-import/types";

export function validatePlanningPokerRows(rows: PlanningPokerRow[]): string[] {
  const warnings: string[] = [];
  const seen = new Set<string>();

  rows.forEach((row, index) => {
    const line = index + 2;
    if (seen.has(row.issue_key)) {
      warnings.push(`Linha ${line}: issue duplicada ${row.issue_key}`);
    }
    seen.add(row.issue_key);

    const points = row.story_points;
    if (points != null && !FIBONACCI.has(points)) {
      warnings.push(
        `Linha ${line}: story_points=${points} fora da escala Fibonacci comum ${[...FIBONACCI].sort((a, b) => a - b).join(", ")}`,
      );
    }
  });

  return warnings;
}
