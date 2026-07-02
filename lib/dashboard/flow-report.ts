import { FLOW_REPORT_APPROXIMATIONS } from "@/lib/dashboard/flow-stages";
import {
  buildFlowReportFiltersMeta,
  flowRpcArgs,
  flowRpcScopeArgs,
  parseFlowGranularity,
  parseFlowReportParams,
  type FlowReportFilters,
} from "@/lib/dashboard/flow-report-params";
import { createLiveSupabase } from "@/lib/supabase/server";

export type FlowCfdRow = {
  data_referencia: string;
  etapa: string;
  quantidade: number;
};

export type FlowThroughputRow = {
  periodo: string;
  quantidade_concluida: number;
};

export type FlowLeadTimeDetailRow = {
  issue_id: string;
  issue_key: string;
  titulo: string | null;
  data_inicio_fluxo: string;
  data_inicio_cycle: string;
  data_conclusao: string;
  lead_time_dias: number;
  cycle_time_dias: number;
};

export type FlowLeadTimeAggRow = {
  periodo: string;
  lead_time_medio: number | null;
  lead_time_mediana: number | null;
  percentil_85: number | null;
  quantidade: number;
};

export type FlowWorkItemAgeRow = {
  issue_id: string;
  issue_key: string;
  titulo: string | null;
  etapa_atual: string;
  responsavel: string;
  data_inicio_fluxo: string;
  dias_em_andamento: number;
};

export type FlowWipRow = {
  etapa: string;
  quantidade: number;
};

export type FlowBottleneckRow = {
  etapa: string;
  quantidade_atual: number;
  idade_media_dias: number | null;
  maior_idade_dias: number | null;
  observacao: string | null;
};

export type FlowStageDwellRow = {
  etapa: string;
  tempo_medio_dias: number | null;
  tempo_mediano_dias: number | null;
  quantidade_issues: number;
  issues_total_periodo: number;
  issues_com_proxy: number;
};

export type FlowDataQualityRow = {
  total_issues: number;
  com_eventos: number;
  com_snapshot_apenas: number;
  com_proxy: number;
  pct_eventos_reais: number | null;
  pct_snapshot_apenas: number | null;
  pct_proxy: number | null;
};

export type FlowReportResponse<T> = {
  filters: ReturnType<typeof buildFlowReportFiltersMeta>;
  approximations: typeof FLOW_REPORT_APPROXIMATIONS;
  data: T;
};

function wrapFlowResponse<T>(
  filters: FlowReportFilters,
  data: T,
  extra?: Record<string, unknown>,
): FlowReportResponse<T> & Record<string, unknown> {
  return {
    filters: buildFlowReportFiltersMeta(filters),
    approximations: FLOW_REPORT_APPROXIMATIONS,
    data,
    ...extra,
  };
}

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T[]> {
  const supabase = createLiveSupabase();
  if (!supabase) throw new Error("Supabase não configurado.");

  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message);
  return (data ?? []) as T[];
}

export async function fetchFlowCfd(filters: FlowReportFilters): Promise<FlowCfdRow[]> {
  return rpc<FlowCfdRow>("report_flow_cfd", flowRpcArgs(filters));
}

export async function fetchFlowThroughput(
  filters: FlowReportFilters,
  granularity: "week" | "month" = "week",
): Promise<FlowThroughputRow[]> {
  return rpc<FlowThroughputRow>("report_flow_throughput", {
    ...flowRpcArgs(filters),
    p_granularity: granularity,
  });
}

export async function fetchFlowLeadTimeAggregation(
  filters: FlowReportFilters,
  granularity: "week" | "month" = "week",
): Promise<FlowLeadTimeAggRow[]> {
  return rpc<FlowLeadTimeAggRow>("report_flow_lead_time_agg", {
    ...flowRpcArgs(filters),
    p_granularity: granularity,
  });
}

export async function fetchFlowLeadTimeDetail(
  filters: FlowReportFilters,
): Promise<FlowLeadTimeDetailRow[]> {
  return rpc<FlowLeadTimeDetailRow>("report_flow_lead_time_detail", flowRpcArgs(filters));
}

/** Endpoint REST — inclui detalhe e agregações semana/mensal. */
export async function fetchFlowLeadTime(filters: FlowReportFilters) {
  const [detail, aggWeek, aggMonth] = await Promise.all([
    fetchFlowLeadTimeDetail(filters),
    fetchFlowLeadTimeAggregation(filters, "week"),
    fetchFlowLeadTimeAggregation(filters, "month"),
  ]);

  return {
    detail,
    aggregation: {
      week: aggWeek,
      month: aggMonth,
    },
  };
}

export async function fetchFlowWorkItemAge(
  filters: FlowReportFilters,
  limit = 10,
): Promise<FlowWorkItemAgeRow[]> {
  return rpc<FlowWorkItemAgeRow>("report_flow_work_item_age", {
    ...flowRpcScopeArgs(filters),
    p_limit: limit,
  });
}

export async function fetchFlowWip(filters: FlowReportFilters): Promise<FlowWipRow[]> {
  return rpc<FlowWipRow>("report_flow_wip", flowRpcScopeArgs(filters));
}

export async function fetchFlowBottlenecks(
  filters: FlowReportFilters,
): Promise<FlowBottleneckRow[]> {
  return rpc<FlowBottleneckRow>("report_flow_bottlenecks", flowRpcScopeArgs(filters));
}

export async function fetchFlowStageDwell(
  filters: FlowReportFilters,
): Promise<FlowStageDwellRow[]> {
  return rpc<FlowStageDwellRow>("report_flow_stage_dwell", flowRpcArgs(filters));
}

export async function fetchFlowDataQuality(
  filters: FlowReportFilters,
): Promise<FlowDataQualityRow | null> {
  const rows = await rpc<FlowDataQualityRow>("report_flow_data_quality", flowRpcArgs(filters));
  return rows[0] ?? null;
}

export async function handleFlowReportRequest<T>(
  request: Request,
  loader: (filters: FlowReportFilters, url: URL) => Promise<T>,
): Promise<FlowReportResponse<T>> {
  const url = new URL(request.url);
  const filters = parseFlowReportParams(url.searchParams);
  const data = await loader(filters, url);
  return wrapFlowResponse(filters, data);
}

export { parseFlowReportParams, parseFlowGranularity, wrapFlowResponse };
