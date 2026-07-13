import type { SupabaseClient } from "@supabase/supabase-js";

import { MILESTONE_ISSUE_CHUNK_SIZE } from "@/lib/dashboard/planning-poker-import/constants";
import {
  issuePatchFromRow,
  milestoneIssueRowFromPlanningPoker,
  utcNowIso,
} from "@/lib/dashboard/planning-poker-import/issue-patch";
import { findIssueKey, resolveMilestoneUuid } from "@/lib/dashboard/planning-poker-import/supabase-lookup";
import type { PlanningPokerImportStats, PlanningPokerRow } from "@/lib/dashboard/planning-poker-import/types";
import { validatePlanningPokerRows } from "@/lib/dashboard/planning-poker-import/validate-rows";

async function createImportRun(
  supabase: SupabaseClient,
  milestoneIid: number | null,
): Promise<string> {
  const { data: runRow, error: runError } = await supabase
    .from("milestone_import_runs")
    .insert({
      source: "excel_planning_poker",
      milestone_gitlab_id: milestoneIid,
      status: "running",
    })
    .select("id")
    .single();

  if (runError || !runRow) {
    throw new Error(runError?.message ?? "Falha ao registrar importação");
  }

  return runRow.id as string;
}

async function finalizeImportRun(
  supabase: SupabaseClient,
  runId: string,
  params: {
    status: "success" | "partial";
    processed: number;
    upsertedIssues: number;
    errors: number;
    notFound: number;
    milestoneIid: number | null;
    upsertedMilestoneIssues: number;
  },
): Promise<void> {
  await supabase
    .from("milestone_import_runs")
    .update({
      status: params.status,
      rows_processed: params.processed,
      rows_upserted: params.upsertedIssues,
      rows_error: params.errors + params.notFound,
      message: `milestone_iid=${params.milestoneIid ?? "null"}, mi=${params.upsertedMilestoneIssues}`,
      finished_at: utcNowIso(),
    })
    .eq("id", runId);
}

async function upsertMilestoneIssueBatches(
  supabase: SupabaseClient,
  milestoneIssueRows: Record<string, unknown>[],
): Promise<{ upserted: number; errors: number }> {
  let upserted = 0;
  let errors = 0;

  for (let start = 0; start < milestoneIssueRows.length; start += MILESTONE_ISSUE_CHUNK_SIZE) {
    const batch = milestoneIssueRows.slice(start, start + MILESTONE_ISSUE_CHUNK_SIZE);
    const { error: miError } = await supabase
      .from("milestone_issues")
      .upsert(batch, { onConflict: "milestone_id,issue_key" });
    if (miError) {
      errors += batch.length;
    } else {
      upserted += batch.length;
    }
  }

  return { upserted, errors };
}

async function processPlanningPokerRow(
  supabase: SupabaseClient,
  row: PlanningPokerRow,
  milestoneIid: number | null,
  milestoneUuid: string | null,
): Promise<{
  upsertedIssue: boolean;
  notFound: boolean;
  error: boolean;
  milestoneIssueRow: Record<string, unknown> | null;
}> {
  const patch = issuePatchFromRow(row, milestoneIid);

  try {
    const issueKey = await findIssueKey(supabase, row);
    if (!issueKey || Object.keys(patch).length === 0) {
      return {
        upsertedIssue: false,
        notFound: true,
        error: false,
        milestoneIssueRow: milestoneUuid
          ? milestoneIssueRowFromPlanningPoker(row, milestoneUuid, issueKey)
          : null,
      };
    }

    const { error: patchError } = await supabase.from("issues").update(patch).eq("issue_key", issueKey);
    if (patchError) {
      return {
        upsertedIssue: false,
        notFound: false,
        error: true,
        milestoneIssueRow: milestoneUuid
          ? milestoneIssueRowFromPlanningPoker(row, milestoneUuid, issueKey)
          : null,
      };
    }

    return {
      upsertedIssue: true,
      notFound: false,
      error: false,
      milestoneIssueRow: milestoneUuid
        ? milestoneIssueRowFromPlanningPoker(row, milestoneUuid, issueKey)
        : null,
    };
  } catch {
    return {
      upsertedIssue: false,
      notFound: false,
      error: true,
      milestoneIssueRow: milestoneUuid
        ? milestoneIssueRowFromPlanningPoker(row, milestoneUuid, null)
        : null,
    };
  }
}

export async function importPlanningPokerRows(
  supabase: SupabaseClient,
  rows: PlanningPokerRow[],
  options: { milestoneIid?: number | null } = {},
): Promise<PlanningPokerImportStats> {
  const warnings = validatePlanningPokerRows(rows);
  const milestoneIid = options.milestoneIid ?? null;
  const runId = await createImportRun(supabase, milestoneIid);

  let processed = 0;
  let upsertedIssues = 0;
  let notFound = 0;
  let errors = 0;

  const milestoneUuid =
    milestoneIid != null ? await resolveMilestoneUuid(supabase, milestoneIid) : null;

  const milestoneIssueRows: Record<string, unknown>[] = [];

  for (const row of rows) {
    processed += 1;
    const result = await processPlanningPokerRow(supabase, row, milestoneIid, milestoneUuid);

    if (result.upsertedIssue) upsertedIssues += 1;
    if (result.notFound) notFound += 1;
    if (result.error) errors += 1;
    if (result.milestoneIssueRow) milestoneIssueRows.push(result.milestoneIssueRow);
  }

  const { upserted: upsertedMilestoneIssues, errors: milestoneErrors } =
    await upsertMilestoneIssueBatches(supabase, milestoneIssueRows);
  errors += milestoneErrors;

  const status = errors === 0 ? "success" : "partial";
  await finalizeImportRun(supabase, runId, {
    status,
    processed,
    upsertedIssues,
    errors,
    notFound,
    milestoneIid,
    upsertedMilestoneIssues,
  });

  return {
    processed,
    upserted_issues: upsertedIssues,
    not_found_in_issues: notFound,
    upserted_milestone_issues: upsertedMilestoneIssues,
    errors,
    warnings,
  };
}
