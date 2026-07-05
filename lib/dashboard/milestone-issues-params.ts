const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

export type MilestoneIssuesMetric =
  | "Todos"
  | "committed"
  | "wip"
  | "delivered"
  | "not_delivered";
export type MilestoneIssuesEstado = "Todos" | "Aberto" | "Fechado";

export type MilestoneIssuesListParams = {
  search: string;
  status: string;
  estado: MilestoneIssuesEstado;
  metric: MilestoneIssuesMetric;
  order: string;
  page: number;
  pageSize: number;
};

function parsePositiveInt(raw: string | null, fallback: number): number {
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

export function parseMilestoneIssuesListParams(
  params: URLSearchParams,
): MilestoneIssuesListParams {
  const metricRaw = params.get("issues_metric");
  const metric: MilestoneIssuesMetric =
    metricRaw === "committed" ||
    metricRaw === "wip" ||
    metricRaw === "delivered" ||
    metricRaw === "not_delivered"
      ? metricRaw
      : "Todos";

  const estadoRaw = params.get("issues_estado");
  const estado: MilestoneIssuesEstado =
    estadoRaw === "Aberto" || estadoRaw === "Fechado" ? estadoRaw : "Todos";

  const pageSize = Math.min(
    parsePositiveInt(params.get("issues_page_size"), DEFAULT_PAGE_SIZE),
    MAX_PAGE_SIZE,
  );

  return {
    search: params.get("issues_search")?.trim() ?? "",
    status: params.get("issues_status")?.trim() || "Todos",
    estado,
    metric,
    order: params.get("issues_order")?.trim() || "gitlab_iid_asc",
    page: parsePositiveInt(params.get("issues_page"), 1),
    pageSize,
  };
}

export function recordFromSearchParams(
  sp: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    }
  }
  return params;
}
