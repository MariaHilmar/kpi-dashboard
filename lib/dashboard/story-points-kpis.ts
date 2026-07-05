import { commonArgs, dateArgs } from "@/lib/dashboard/filters";
import { createServerSupabase } from "@/lib/supabase/server";
import type { DashboardFilters } from "@/types/database";

export type StoryPointsKpis = {
  pontos_abertos: number;
  pontos_fechados: number;
  issues_sem_pontos: number;
};

export async function fetchStoryPointsKpis(
  filters: DashboardFilters,
): Promise<StoryPointsKpis | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc("dashboard_story_points_kpis", {
    ...commonArgs(filters),
    ...dateArgs(filters),
  });

  if (error) {
    console.error("dashboard_story_points_kpis", error.message);
    return null;
  }

  const row = (data ?? [])[0] as Record<string, unknown> | undefined;
  if (!row) return null;

  return {
    pontos_abertos: Number(row.pontos_abertos ?? 0),
    pontos_fechados: Number(row.pontos_fechados ?? 0),
    issues_sem_pontos: Number(row.issues_sem_pontos ?? 0),
  };
}
