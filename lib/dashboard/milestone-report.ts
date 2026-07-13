import { createLiveSupabase, createServerSupabase } from "@/lib/supabase/server";

import type { AggregateDimension } from "./constants";
import { TOP_LIMIT } from "./constants";
import type { FlowGranularity } from "./flow-report-params";
import type { FlowLeadTimeDetailRow, FlowStageDwellRow } from "./flow-report";
import type { MilestoneCapacityRow } from "./milestone-capacity";
import type {
  MilestoneDeliveryDimension,
  MilestoneDeliveryRow,
} from "./milestone-delivery";
import type {
  MilestoneRoadmapGroupBy,
  MilestoneRoadmapRow,
} from "./milestone-roadmap";
import type { MilestoneCommitment } from "./milestone-commitment";
import type {
  MilestoneBurndownRow,
  MilestoneMixRow,
  MilestoneSummary,
  MilestoneWipRow,
} from "./milestone-aggregates";

export type MilestoneDetail = {
  id: string;
  gitlab_milestone_iid: number;
  titulo: string;
  start_date: string | null;
  due_date: string | null;
  state: string | null;
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
  const supabase = (await createServerSupabase()) ?? createLiveSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("milestones")
    .select("id, gitlab_milestone_iid, titulo, start_date, due_date, state")
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
    state: data.state,
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

export async function fetchMilestoneCommitment(
  milestoneIid: number,
): Promise<MilestoneCommitment | null> {
  const rows = await rpc<MilestoneCommitment>("report_milestone_commitment", {
    p_milestone_iid: milestoneIid,
  });
  const row = rows[0];
  if (!row) return null;

  return {
    start_date: row.start_date,
    due_date: row.due_date,
    committed_issues: Number(row.committed_issues),
    committed_story_points: Number(row.committed_story_points),
    delivered_issues: Number(row.delivered_issues),
    delivered_story_points: Number(row.delivered_story_points),
    not_delivered_issues: Number(row.not_delivered_issues),
    not_delivered_story_points: Number(row.not_delivered_story_points),
    has_story_points: Boolean(row.has_story_points),
    missing_close_date_issues: Number(row.missing_close_date_issues),
  };
}

export async function fetchMilestoneSummary(milestoneIid: number): Promise<MilestoneSummary | null> {
  const rows = await rpc<MilestoneSummary>("report_milestone_summary", {
    p_milestone_iid: milestoneIid,
  });
  const row = rows[0];
  if (!row) return null;

  return {
    ref_date: row.ref_date,
    wip_issues: Number(row.wip_issues),
    wip_story_points: Number(row.wip_story_points),
    committed_issues: Number(row.committed_issues),
    committed_story_points: Number(row.committed_story_points),
    delivered_issues: Number(row.delivered_issues),
    delivered_story_points: Number(row.delivered_story_points),
  };
}

export async function fetchMilestoneBurndown(
  milestoneIid: number,
): Promise<MilestoneBurndownRow[]> {
  const rows = await rpc<MilestoneBurndownRow>("report_milestone_burndown", {
    p_milestone_iid: milestoneIid,
  });

  return rows.map((row) => ({
    snapshot_date: row.snapshot_date,
    points_remaining: Number(row.points_remaining),
    issues_open: Number(row.issues_open),
    points_done: Number(row.points_done),
    issues_done: Number(row.issues_done),
    points_committed: Number(row.points_committed),
    issues_committed: Number(row.issues_committed),
    points_ideal: row.points_ideal == null ? null : Number(row.points_ideal),
    source: row.source,
  }));
}

export async function fetchMilestoneWip(milestoneIid: number): Promise<MilestoneWipRow[]> {
  const rows = await rpc<MilestoneWipRow>("report_milestone_wip", {
    p_milestone_iid: milestoneIid,
  });

  return rows.map((row) => ({
    ref_date: row.ref_date,
    etapa: row.etapa,
    quantidade: Number(row.quantidade),
    story_points: Number(row.story_points),
  }));
}

export async function fetchMilestoneRoadmap(
  fromIid: number,
  toIid: number,
  groupBy: MilestoneRoadmapGroupBy = "modulo",
  topN?: number,
): Promise<MilestoneRoadmapRow[]> {
  const rows = await rpc<{
    milestone_iid: number;
    milestone_titulo: string;
    milestone_start_date: string | null;
    milestone_due_date: string | null;
    label: string;
    rank_in_sprint: number;
    entregues: number;
    pontos_entregues: number;
  }>("report_milestone_roadmap", {
    p_from_iid: fromIid,
    p_to_iid: toIid,
    p_group_by: groupBy,
    p_top_n: topN ?? null,
  });

  return rows.map((row) => ({
    milestone_iid: Number(row.milestone_iid),
    milestone_titulo: row.milestone_titulo,
    milestone_start_date: row.milestone_start_date,
    milestone_due_date: row.milestone_due_date,
    label: row.label,
    rank_in_sprint: Number(row.rank_in_sprint),
    entregues: Number(row.entregues),
    pontos_entregues: Number(row.pontos_entregues),
  }));
}

export async function fetchMilestoneCapacityByTeam(
  fromIid: number,
  toIid: number,
): Promise<MilestoneCapacityRow[]> {
  const rows = await rpc<{
    milestone_iid: number;
    milestone_titulo: string;
    equipe: string;
    fechadas?: number;
    entregues: number;
    pontos_entregues: number;
  }>("report_milestone_capacity_by_team", {
    p_from_iid: fromIid,
    p_to_iid: toIid,
  });

  return rows.map((row) => ({
    milestone_iid: Number(row.milestone_iid),
    milestone_titulo: row.milestone_titulo,
    equipe: row.equipe,
    fechadas: Number(row.fechadas ?? 0),
    entregues: Number(row.entregues),
    pontos_entregues: Number(row.pontos_entregues),
  }));
}

export async function fetchMilestoneDeliveryByDimension(
  milestoneIid: number,
  dimension: MilestoneDeliveryDimension,
  limit?: number,
): Promise<MilestoneDeliveryRow[]> {
  const rows = await rpc<{
    label: string;
    entregues: number;
    pontos_entregues: number;
    wip_restante: number;
    wip_pontos: number;
  }>("report_milestone_delivery_by_dimension", {
    p_milestone_iid: milestoneIid,
    p_dimension: dimension,
    p_limit: limit ?? null,
  });

  return rows.map((row) => ({
    label: row.label,
    entregues: Number(row.entregues),
    pontos_entregues: Number(row.pontos_entregues),
    wip_restante: Number(row.wip_restante),
    wip_pontos: Number(row.wip_pontos),
  }));
}

export async function fetchMilestoneMix(
  milestoneIid: number,
  dimension: AggregateDimension,
  limit = TOP_LIMIT.equipe,
): Promise<MilestoneMixRow[]> {
  const rows = await rpc<MilestoneMixRow>("report_milestone_mix", {
    p_milestone_iid: milestoneIid,
    p_dimension: dimension,
    p_limit: limit,
  });

  return rows.map((row) => ({
    serie: row.serie as MilestoneMixRow["serie"],
    label: row.label,
    quantidade: Number(row.quantidade),
  }));
}

export async function fetchMilestoneStageDwell(
  milestoneIid: number,
): Promise<FlowStageDwellRow[]> {
  const rows = await rpc<FlowStageDwellRow>("report_milestone_stage_dwell", {
    p_milestone_iid: milestoneIid,
  });

  return rows.map((row) => ({
    etapa: row.etapa,
    tempo_medio_dias:
      row.tempo_medio_dias == null ? null : Number(row.tempo_medio_dias),
    tempo_mediano_dias:
      row.tempo_mediano_dias == null ? null : Number(row.tempo_mediano_dias),
    quantidade_issues: Number(row.quantidade_issues),
    issues_total_periodo: Number(row.issues_total_periodo),
    issues_com_proxy: Number(row.issues_com_proxy),
  }));
}

export async function fetchMilestoneLeadTimeDetail(
  milestoneIid: number,
): Promise<FlowLeadTimeDetailRow[]> {
  const rows = await rpc<FlowLeadTimeDetailRow>("report_milestone_lead_time_detail", {
    p_milestone_iid: milestoneIid,
  });

  return rows.map((row) => ({
    issue_id: row.issue_id,
    issue_key: row.issue_key,
    titulo: row.titulo,
    data_inicio_fluxo: row.data_inicio_fluxo,
    data_inicio_cycle: row.data_inicio_cycle,
    data_conclusao: row.data_conclusao,
    lead_time_dias: Number(row.lead_time_dias),
    cycle_time_dias: Number(row.cycle_time_dias),
  }));
}

export type MilestoneIssueRow = {
  issue_key: string;
  gitlab_iid: number;
  gitlab_repo: string;
  titulo: string | null;
  story_points: number | null;
  status: string | null;
  etapa: string | null;
  assignee: string | null;
  ultimo_comentario: string | null;
  homologado: string | null;
  estado: string | null;
  fechado_em: string | null;
};

export type MilestoneIssuesSearchParams = {
  search?: string;
  status?: string;
  estado?: string;
  metric?: string;
  order?: string;
  page?: number;
  pageSize?: number;
};

export type MilestoneIssuesSearchResult = {
  rows: MilestoneIssueRow[];
  total: number;
  page: number;
  pageSize: number;
};

export async function fetchMilestoneIssues(
  milestoneIid: number,
  params: MilestoneIssuesSearchParams = {},
): Promise<MilestoneIssuesSearchResult> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 50;
  const offset = (page - 1) * pageSize;

  const rows = await rpc<{
    total_count: number;
    issue_key: string;
    gitlab_iid: number;
    gitlab_repo: string;
    titulo: string | null;
    story_points: number | null;
    status: string | null;
    etapa: string | null;
    assignee: string | null;
    ultimo_comentario: string | null;
    homologado: string | null;
    estado: string | null;
    fechado_em: string | null;
  }>("report_milestone_issues", {
    p_milestone_iid: milestoneIid,
    p_search: params.search?.trim() || null,
    p_status: params.status && params.status !== "Todos" ? params.status : null,
    p_estado: params.estado && params.estado !== "Todos" ? params.estado : null,
    p_metric: params.metric && params.metric !== "Todos" ? params.metric : null,
    p_order: params.order ?? "gitlab_iid_asc",
    p_limit: pageSize,
    p_offset: offset,
  });

  const total = rows[0]?.total_count != null ? Number(rows[0].total_count) : 0;

  return {
    rows: rows.map((row) => {
      const { total_count, ...rest } = row;
      void total_count;

      return {
        ...rest,
        gitlab_iid: Number(rest.gitlab_iid),
        story_points: rest.story_points == null ? null : Number(rest.story_points),
      };
    }),
    total,
    page,
    pageSize,
  };
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
