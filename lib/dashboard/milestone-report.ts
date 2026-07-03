import { createLiveSupabase } from "@/lib/supabase/server";

import type { FlowGranularity } from "./flow-report-params";

export type MilestoneDetail = {
  id: string;
  gitlab_milestone_iid: number;
  titulo: string;
  start_date: string | null;
  due_date: string | null;
};

export type MilestoneThroughputRow = {
  periodo: string;
  quantidade_concluida: number;
  story_points: number;
};

export type MilestoneThroughputResponse = {
  milestone: MilestoneDetail | null;
  granularity: FlowGranularity;
  data: MilestoneThroughputRow[];
};

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T[]> {
  const supabase = createLiveSupabase();
  if (!supabase) throw new Error("Supabase não configurado.");

  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message);
  return (data ?? []) as T[];
}

export async function fetchMilestoneDetail(
  milestoneIid: number,
): Promise<MilestoneDetail | null> {
  const supabase = createLiveSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("milestones")
    .select("id, gitlab_milestone_iid, titulo, start_date, due_date")
    .eq("gitlab_milestone_iid", milestoneIid)
    .maybeSingle();

  if (error) {
    console.error("fetchMilestoneDetail", error.message);
    return null;
  }

  if (!data?.gitlab_milestone_iid) return null;

  return {
    id: data.id,
    gitlab_milestone_iid: data.gitlab_milestone_iid,
    titulo: data.titulo,
    start_date: data.start_date,
    due_date: data.due_date,
  };
}

export async function fetchMilestoneThroughput(
  milestoneIid: number,
  granularity: FlowGranularity = "week",
): Promise<MilestoneThroughputRow[]> {
  const rows = await rpc<MilestoneThroughputRow>("report_milestone_throughput", {
    p_milestone_iid: milestoneIid,
    p_granularity: granularity,
  });

  return rows.map((row) => ({
    periodo: row.periodo,
    quantidade_concluida: Number(row.quantidade_concluida),
    story_points: Number(row.story_points),
  }));
}

export async function fetchMilestoneThroughputReport(
  milestoneIid: number,
  granularity: FlowGranularity = "week",
): Promise<MilestoneThroughputResponse> {
  const [milestone, data] = await Promise.all([
    fetchMilestoneDetail(milestoneIid),
    fetchMilestoneThroughput(milestoneIid, granularity),
  ]);

  return { milestone, granularity, data };
}

/** Link para /fluxo com o recorte temporal da milestone. */
export function buildMilestoneFluxoHref(
  startDate: string,
  endDate: string,
  granularity: FlowGranularity = "week",
): string {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
    granularity,
  });
  return `/fluxo?${params.toString()}`;
}
