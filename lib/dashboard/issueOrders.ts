export type IssueSortColumn = {
  key: string;
  asc: string;
  desc: string;
};

export const ISSUE_SORT_COLUMNS: IssueSortColumn[] = [
  { key: "id", asc: "id_asc", desc: "id_desc" },
  { key: "titulo", asc: "titulo_asc", desc: "titulo_desc" },
  { key: "modulo", asc: "modulo_asc", desc: "modulo_desc" },
  { key: "tipo", asc: "tipo_asc", desc: "tipo_desc" },
  { key: "estado", asc: "estado_asc", desc: "estado_desc" },
  { key: "prioridade", asc: "prioridade_asc", desc: "prioridade_desc" },
  { key: "equipe", asc: "equipe_asc", desc: "equipe_desc" },
  { key: "criado", asc: "criado_em_asc", desc: "criado_em_desc" },
  { key: "lead", asc: "lead_time_asc", desc: "lead_time_desc" },
  { key: "idade", asc: "idade_asc", desc: "idade_desc" },
];

export const DEFAULT_ISSUE_ORDER = "criado_em_desc";

export function getIssueSortColumn(key: string): IssueSortColumn | undefined {
  return ISSUE_SORT_COLUMNS.find((column) => column.key === key);
}

export function getIssueColumnSortDirection(
  order: string,
  columnKey: string,
): "asc" | "desc" | null {
  const column = getIssueSortColumn(columnKey);
  if (!column) return null;
  if (order === column.asc) return "asc";
  if (order === column.desc) return "desc";
  return null;
}

/** Alterna asc/desc; primeira interação usa desc (exceto ID, que usa desc por padrão). */
export function toggleIssueColumnOrder(currentOrder: string, columnKey: string): string {
  const column = getIssueSortColumn(columnKey);
  if (!column) return currentOrder;

  if (currentOrder === column.desc) return column.asc;
  return column.desc;
}
