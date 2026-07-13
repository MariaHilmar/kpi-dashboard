import type { PlanningPokerImportStats } from "@/lib/dashboard/planning-poker-import";

export type DryRunResult = {
  dry_run: true;
  rows: number;
  warnings: string[];
  sample: Array<Record<string, unknown>>;
};

export type ImportResponse = PlanningPokerImportStats | DryRunResult;

export type ImportLoadingMode = "validate" | "import" | null;
