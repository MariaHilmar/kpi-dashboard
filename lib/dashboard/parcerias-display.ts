import { resolveIssueEstadoLabel } from "@/lib/dashboard/issue-estado-display";
import { resolveIssueWorkflowStatusLabel } from "@/lib/dashboard/issue-status";
import type { IssueRow } from "@/lib/dashboard/issues";

export function formatParceriasDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value.includes("T") ? value : `${value}T12:00:00`).toLocaleDateString("pt-BR");
}

export function formatParceriasText(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

export function formatParceriasEstado(row: Pick<IssueRow, "estado">): string {
  return resolveIssueEstadoLabel(row);
}

export function formatParceriasStatus(row: Pick<IssueRow, "status">): string {
  return resolveIssueWorkflowStatusLabel(row);
}

/** Colunas compartilhadas entre tabela e export Excel. */
export const PARCERIAS_DETAIL_HEADERS = [
  "Módulo",
  "Tipo",
  "Estado",
  "Status",
  "Prioridade",
  "Criado em",
  "Data prevista",
  "Fechado em",
] as const;

export function parceriasDetailValues(row: IssueRow): string[] {
  return [
    formatParceriasText(row.modulo),
    formatParceriasText(row.tipo),
    formatParceriasEstado(row),
    formatParceriasStatus(row),
    formatParceriasText(row.prioridade),
    formatParceriasDate(row.criado_em),
    formatParceriasDate(row.entrega_prevista),
    formatParceriasDate(row.fechado_em),
  ];
}

export function parceriasExportHeaders(showParceria: boolean): string[] {
  const base = ["Issue (IID)", "Título", ...PARCERIAS_DETAIL_HEADERS];
  return showParceria ? ["Parceria", ...base] : base;
}

export function parceriasExportRowValues(
  row: IssueRow,
  showParceria: boolean,
  issueCell: string | { text: string; hyperlink: string; tooltip?: string },
): Array<string | typeof issueCell> {
  const detail = parceriasDetailValues(row);
  return showParceria
    ? [formatParceriasText(row.parceria), issueCell, row.titulo ?? "—", ...detail]
    : [issueCell, row.titulo ?? "—", ...detail];
}
