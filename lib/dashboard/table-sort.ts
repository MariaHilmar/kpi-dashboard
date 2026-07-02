export type SortColumn = {
  key: string;
  asc: string;
  desc: string;
};

export function getSortColumn(
  columns: SortColumn[],
  key: string,
): SortColumn | undefined {
  return columns.find((column) => column.key === key);
}

export function getColumnSortDirection(
  order: string,
  columnKey: string,
  columns: SortColumn[],
): "asc" | "desc" | null {
  const column = getSortColumn(columns, columnKey);
  if (!column) return null;
  if (order === column.asc) return "asc";
  if (order === column.desc) return "desc";
  return null;
}

/** Alterna asc/desc; primeira interação usa desc. */
export function toggleColumnOrder(
  currentOrder: string,
  columnKey: string,
  columns: SortColumn[],
): string {
  const column = getSortColumn(columns, columnKey);
  if (!column) return currentOrder;

  if (currentOrder === column.desc) return column.asc;
  return column.desc;
}

export function isValidSortOrder(order: string, columns: SortColumn[]): boolean {
  return columns.some((column) => column.asc === order || column.desc === order);
}

export function resolveSortOrder(
  raw: string | null | undefined,
  columns: SortColumn[],
  fallback: string,
): string {
  if (!raw || !isValidSortOrder(raw, columns)) return fallback;
  return raw;
}
