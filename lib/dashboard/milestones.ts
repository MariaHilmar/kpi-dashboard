import { createServerSupabase } from "@/lib/supabase/server";

export type MilestoneOption = {
  id: string;
  gitlab_milestone_iid: number | null;
  titulo: string;
};

export async function listMilestoneOptions(limit = 60): Promise<MilestoneOption[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("milestones")
    .select("id, gitlab_milestone_iid, titulo")
    .not("gitlab_milestone_iid", "is", null)
    .order("gitlab_milestone_iid", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("listMilestoneOptions", error.message);
    return [];
  }

  return (data ?? []) as MilestoneOption[];
}
