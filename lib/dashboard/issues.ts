import { commonArgs } from "@/lib/dashboard/filters";
import type { IssueEstado, IssueSla } from "@/lib/dashboard/constants";
import { createServerSupabase } from "@/lib/supabase/server";
import type { DashboardFilters } from "@/types/database";

export type IssueRow = {
  total_count: number;
  gitlab_iid: number | null;
  gitlab_repo: string | null;
  titulo: string | null;
  modulo: string | null;
  area_funcional: string | null;
  tipo: string | null;
  estado: string | null;
  status: string | null;
  prioridade: string | null;
  equipe: string | null;
  parceria: string | null;
  sprint: string | null;
  epico: string | null;
  desenvolvedor: string | null;
  assignee: string | null;
  criado_em: string | null;
  fechado_em: string | null;
  lead_time_dias: number | null;
  idade_dias: number | null;
  sla_mais_90_dias: boolean | null;
};

export type IssuesSearchParams = {
  search: string;
  estado: IssueEstado;
  sla: IssueSla;
  autor: string;
  criadoDe: string | null;
  criadoAte: string | null;
  order: string;
  page: number;
  pageSize: number;
};

export type IssuesSearchResult = {
  rows: IssueRow[];
  total: number;
  page: number;
  pageSize: number;
};

export async function searchIssues(
  filters: DashboardFilters,
  params: IssuesSearchParams,
): Promise<IssuesSearchResult> {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return { rows: [], total: 0, page: params.page, pageSize: params.pageSize };
  }

  const offset = (params.page - 1) * params.pageSize;

  const args = {
    ...commonArgs(filters),
    p_search: params.search || null,
    p_estado: params.estado,
    p_sla: params.sla,
    p_autor: params.autor,
    p_criado_de: params.criadoDe,
    p_criado_ate: params.criadoAte,
    p_order: params.order,
    p_limit: params.pageSize,
    p_offset: offset,
  };

  const { data, error } = await supabase.rpc("search_issues", args);

  if (error) {
    console.error("search_issues", error.message);
    return { rows: [], total: 0, page: params.page, pageSize: params.pageSize };
  }

  const rows = (data ?? []) as IssueRow[];
  const total = rows.length > 0 ? Number(rows[0].total_count ?? 0) : 0;

  return { rows, total, page: params.page, pageSize: params.pageSize };
}
