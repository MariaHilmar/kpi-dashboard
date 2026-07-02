import {
  getColumnSortDirection,
  resolveSortOrder,
  toggleColumnOrder,
  type SortColumn,
} from "@/lib/dashboard/table-sort";
import { TODOS } from "@/lib/dashboard/constants";

export const PARCERIAS_SORT_COLUMNS: SortColumn[] = [
  { key: "parceria", asc: "parceria_asc", desc: "parceria_desc" },
  { key: "id", asc: "id_asc", desc: "id_desc" },
  { key: "titulo", asc: "titulo_asc", desc: "titulo_desc" },
  { key: "modulo", asc: "modulo_asc", desc: "modulo_desc" },
  { key: "tipo", asc: "tipo_asc", desc: "tipo_desc" },
  { key: "estado", asc: "estado_asc", desc: "estado_desc" },
  { key: "status", asc: "status_asc", desc: "status_desc" },
  { key: "prioridade", asc: "prioridade_asc", desc: "prioridade_desc" },
  { key: "criado", asc: "criado_em_asc", desc: "criado_em_desc" },
  { key: "entrega", asc: "entrega_prevista_asc", desc: "entrega_prevista_desc" },
  { key: "fechado", asc: "fechado_em_asc", desc: "fechado_em_desc" },
];

export function parceriasDefaultOrder(parceiro: string): string {
  return parceiro === TODOS ? "parceria_asc" : "fechado_em_desc";
}

export function resolveParceriasOrder(
  raw: string | null | undefined,
  parceiro: string,
): string {
  return resolveSortOrder(raw, PARCERIAS_SORT_COLUMNS, parceriasDefaultOrder(parceiro));
}

export function getParceriasColumnSortDirection(
  order: string,
  columnKey: string,
): "asc" | "desc" | null {
  return getColumnSortDirection(order, columnKey, PARCERIAS_SORT_COLUMNS);
}

export function toggleParceriasColumnOrder(currentOrder: string, columnKey: string): string {
  return toggleColumnOrder(currentOrder, columnKey, PARCERIAS_SORT_COLUMNS);
}
