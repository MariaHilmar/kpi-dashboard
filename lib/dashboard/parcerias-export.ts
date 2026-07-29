import ExcelJS from "exceljs";

import { addIssueDistributionChartsSheet } from "@/lib/dashboard/issues-export-charts";
import { resolveGitlabWorkItemUrl } from "@/lib/dashboard/gitlab-url";
import { applyIssueEstadoExcelStyle } from "@/lib/dashboard/issue-estado-display";
import { applyIssueStatusExcelStyle, resolveIssueWorkflowStatusLabel } from "@/lib/dashboard/issue-status";
import type { IssueRow } from "@/lib/dashboard/issues";
import {
  formatParceriaLabel,
  formatParceriasPeriodLabel,
  parceriasExportSlug,
  parceriasShowParceriaColumn,
} from "@/lib/dashboard/parcerias-config";
import {
  parceriasExportHeaders,
  parceriasExportRowValues,
} from "@/lib/dashboard/parcerias-display";

const THIN_BORDER: ExcelJS.Border = { style: "thin", color: { argb: "FFD9D9D9" } };
const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFEFF3FB" },
};

function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, size: 10 };
    cell.fill = HEADER_FILL;
    cell.border = { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER };
  });
}

function styleDataRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.border = { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER };
    cell.font = { size: 10 };
  });
}

function issueIidCellValue(row: IssueRow): string | ExcelJS.CellHyperlinkValue {
  const label = row.gitlab_iid != null ? `#${row.gitlab_iid}` : "—";
  const url = resolveGitlabWorkItemUrl({
    gitlabRepo: row.gitlab_repo,
    gitlabIid: row.gitlab_iid,
  });

  if (url && label !== "—") {
    return { text: label, hyperlink: url, tooltip: url };
  }
  return label;
}

function setIssueIidCell(cell: ExcelJS.Cell, row: IssueRow) {
  const value = issueIidCellValue(row);
  cell.value = value;
  if (typeof value === "object" && value !== null && "hyperlink" in value) {
    cell.font = { size: 10, color: { argb: "FF1351B4" }, underline: true };
  }
}

export type ParceriasExportParams = {
  parceiro: string;
  fechadoDe: string;
  fechadoAte: string;
  rows: IssueRow[];
};

/** Export enxuto para entrega às parcerias. */
export async function buildParceriasExportWorkbook(
  params: ParceriasExportParams,
): Promise<ExcelJS.Buffer> {
  const { parceiro, fechadoDe, fechadoAte, rows } = params;
  const periodo = formatParceriasPeriodLabel(fechadoDe, fechadoAte);
  const showParceria = parceriasShowParceriaColumn(parceiro);
  const label = formatParceriaLabel(parceiro);
  const headers = parceriasExportHeaders(showParceria);
  const lastCol = String.fromCharCode(64 + headers.length);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "KPI Dashboard";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Demandas");
  sheet.columns = headers.map((header) => ({
    width: header === "Título" ? 52 : 14,
  }));

  sheet.mergeCells(`A1:${lastCol}1`);
  sheet.getCell("A1").value = `Relatório ${label} — fechamento ${periodo}`;
  sheet.getCell("A1").font = { bold: true, size: 12 };

  sheet.mergeCells(`A2:${lastCol}2`);
  sheet.getCell("A2").value = `${rows.length} demanda(s)`;
  sheet.getCell("A2").font = { size: 10, color: { argb: "FF475569" } };

  const headerRow = sheet.addRow(headers);
  styleHeaderRow(headerRow);

  const issueColIndex = showParceria ? 2 : 1;
  const estadoColIndex = headers.indexOf("Estado") + 1;
  const statusColIndex = headers.indexOf("Status") + 1;

  for (const row of rows) {
    const statusLabel = resolveIssueWorkflowStatusLabel(row);
    const values = parceriasExportRowValues(row, showParceria, issueIidCellValue(row));
    const dataRow = sheet.addRow(values);
    setIssueIidCell(dataRow.getCell(issueColIndex), row);
    styleDataRow(dataRow);
    if (estadoColIndex > 0) {
      applyIssueEstadoExcelStyle(dataRow.getCell(estadoColIndex), row);
    }
    if (statusColIndex > 0 && statusLabel !== "—") {
      applyIssueStatusExcelStyle(dataRow.getCell(statusColIndex), statusLabel);
    }
  }

  await addIssueDistributionChartsSheet(workbook, rows, {
    title: `Distribuições — ${label} — ${rows.length} demanda(s) no recorte`,
  });

  return workbook.xlsx.writeBuffer();
}

export function buildParceriasExportFilename(parceiro: string, total: number): string {
  const date = new Date().toISOString().slice(0, 10);
  const slug = parceriasExportSlug(parceiro);
  return `relatorio-parceria-${slug}-${date}-${total}-demandas.xlsx`;
}
