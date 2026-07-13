import type { SupabaseClient } from "@supabase/supabase-js";

import { repoDisplayName } from "@/lib/dashboard/gitlab-url";
import type { PlanningPokerRow } from "@/lib/dashboard/planning-poker-import/types";

function repoMatchValues(slug: string): string[] {
  const display = repoDisplayName(slug);
  return [...new Set([slug, display])];
}

export async function findIssueKey(
  supabase: SupabaseClient,
  row: PlanningPokerRow,
): Promise<string | null> {
  const repos = repoMatchValues(row.gitlab_repo);

  for (const repo of repos) {
    const { data, error } = await supabase
      .from("issues")
      .select("issue_key")
      .eq("gitlab_iid", row.gitlab_iid)
      .eq("gitlab_repo", repo)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    if (data?.issue_key) return data.issue_key as string;
  }

  const { data: byKey } = await supabase
    .from("issues")
    .select("issue_key")
    .eq("issue_key", row.issue_key)
    .limit(1)
    .maybeSingle();

  return (byKey?.issue_key as string | undefined) ?? null;
}

export async function resolveMilestoneUuid(
  supabase: SupabaseClient,
  milestoneIid: number,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("milestones")
    .select("id")
    .eq("gitlab_milestone_iid", milestoneIid)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data?.id as string | undefined) ?? null;
}
