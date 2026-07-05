import {
  getColumnSortDirection,
  resolveSortOrder,
  toggleColumnOrder,
  type SortColumn,
} from "@/lib/dashboard/table-sort";

export const ISSUE_LIST_SORT_COLUMNS: SortColumn[] = [
  { key: "id", asc: "id_asc", desc: "id_desc" },
  { key: "titulo", asc: "titulo_asc", desc: "titulo_desc" },
  { key: "modulo", asc: "modulo_asc", desc: "modulo_desc" },
  { key: "tipo", asc: "tipo_asc", desc: "tipo_desc" },
  { key: "estado", asc: "estado_asc", desc: "estado_desc" },
  { key: "status", asc: "status_asc", desc: "status_desc" },
  { key: "prioridade", asc: "prioridade_asc", desc: "prioridade_desc" },
  { key: "equipe", asc: "equipe_asc", desc: "equipe_desc" },
  { key: "parceria", asc: "parceria_asc", desc: "parceria_desc" },
  { key: "criado", asc: "criado_em_asc", desc: "criado_em_desc" },
  { key: "fechado", asc: "fechado_em_asc", desc: "fechado_em_desc" },
  { key: "lead", asc: "lead_time_asc", desc: "lead_time_desc" },
  { key: "idade", asc: "idade_asc", desc: "idade_desc" },
  { key: "pontos", asc: "story_points_asc", desc: "story_points_desc" },
];

export const DEFAULT_ISSUE_LIST_ORDER = "criado_em_desc";

export function resolveIssueListOrder(raw: string | null | undefined): string {
  return resolveSortOrder(raw, ISSUE_LIST_SORT_COLUMNS, DEFAULT_ISSUE_LIST_ORDER);
}

export function getIssueColumnSortDirection(
  order: string,
  columnKey: string,
): "asc" | "desc" | null {
  return getColumnSortDirection(order, columnKey, ISSUE_LIST_SORT_COLUMNS);
}

export function toggleIssueColumnOrder(currentOrder: string, columnKey: string): string {
  return toggleColumnOrder(currentOrder, columnKey, ISSUE_LIST_SORT_COLUMNS);
}
