import type ExcelJS from "exceljs";

import { isIssueOpen, issueEstadoLabel } from "@/lib/dashboard/issue-state";
import type { IssueRow } from "@/lib/dashboard/issues";

export type IssueEstadoTone = {
  badgeClassName: string;
  excelFillArgb: string;
  excelFontArgb: string;
};

const ESTADO_TONES = {
  open: {
    badgeClassName: "bg-orange-100 text-orange-800",
    excelFillArgb: "FFFFEDD5",
    excelFontArgb: "FF9A3412",
  },
  closed: {
    badgeClassName: "bg-emerald-100 text-emerald-800",
    excelFillArgb: "FFD1FAE5",
    excelFontArgb: "FF065F46",
  },
} satisfies Record<"open" | "closed", IssueEstadoTone>;

export function resolveIssueEstadoLabel(
  row: Pick<IssueRow, "estado">,
): ReturnType<typeof issueEstadoLabel> {
  return issueEstadoLabel(row.estado);
}

export function getIssueEstadoTone(row: Pick<IssueRow, "estado">): IssueEstadoTone {
  return isIssueOpen(row.estado) ? ESTADO_TONES.open : ESTADO_TONES.closed;
}

export function applyIssueEstadoExcelStyle(
  cell: ExcelJS.Cell,
  row: Pick<IssueRow, "estado">,
): void {
  const tone = getIssueEstadoTone(row);
  cell.value = resolveIssueEstadoLabel(row);
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: tone.excelFillArgb },
  };
  cell.font = {
    size: 10,
    bold: true,
    color: { argb: tone.excelFontArgb },
  };
  cell.alignment = { horizontal: "center", vertical: "middle" };
}
