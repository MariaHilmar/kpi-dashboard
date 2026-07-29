import ExcelJS from "exceljs";

import {
  addIssueDistributionChartsSheet,
} from "@/lib/dashboard/issues-export-charts";
import { resolveGitlabWorkItemUrl } from "@/lib/dashboard/gitlab-url";
import {
  applyIssueEstadoExcelStyle,
} from "@/lib/dashboard/issue-estado-display";
import {
  applyIssueStatusExcelStyle,
  resolveIssueWorkflowStatusLabel,
} from "@/lib/dashboard/issue-status";
import type { IssueRow } from "@/lib/dashboard/issues";

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

  if (!url || label === "—") return label;
  return { text: label, hyperlink: url, tooltip: url };
}

function setIssueIidCell(cell: ExcelJS.Cell, row: IssueRow) {
  const value = issueIidCellValue(row);
  cell.value = value;
  if (typeof value === "object" && value !== null && "hyperlink" in value) {
    cell.font = { size: 10, color: { argb: "FF1351B4" }, underline: true };
  }
}

function formatExportDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR");
}

/** Gera workbook Excel com abas Dados (todas as colunas) e Gráficos (pizzas). */
export async function buildIssuesExportWorkbook(rows: IssueRow[]): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "KPI Dashboard";
  workbook.created = new Date();

  const dados = workbook.addWorksheet("Dados");
  const headerRow = dados.addRow([
    "Issue (IID)",
    "Título",
    "Módulo",
    "Área funcional",
    "Tipo",
    "Estado",
    "Status",
    "Prioridade",
    "Equipe",
    "Parceria",
    "Sprint",
    "Épico",
    "Desenvolvedor",
    "Responsável",
    "Story points",
    "Aceita",
    "Justificada",
    "Recorrente",
    "Horas estimada",
    "Horas prevista",
    "Homologado",
    "Criado em",
    "Fechado em",
    "Lead (d)",
    "Idade (d)",
    "SLA > 90d",
    "URL GitLab",
  ]);
  styleHeaderRow(headerRow);
  dados.columns = [
    { width: 12 },
    { width: 48 },
    { width: 16 },
    { width: 16 },
    { width: 14 },
    { width: 12 },
    { width: 18 },
    { width: 12 },
    { width: 14 },
    { width: 16 },
    { width: 14 },
    { width: 16 },
    { width: 18 },
    { width: 18 },
    { width: 12 },
    { width: 10 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 50 },
  ];

  const estadoColIndex = 6;
  const statusColIndex = 7;

  for (const row of rows) {
    const statusLabel = resolveIssueWorkflowStatusLabel(row);
    const dataRow = dados.addRow([
      issueIidCellValue(row),
      row.titulo ?? "—",
      row.modulo ?? "—",
      row.area_funcional ?? "—",
      row.tipo ?? "—",
      null,
      statusLabel === "—" ? "—" : statusLabel,
      row.prioridade ?? "—",
      row.equipe ?? "—",
      row.parceria ?? "—",
      row.sprint ?? "—",
      row.epico ?? "—",
      row.desenvolvedor ?? "—",
      row.assignee ?? "—",
      row.story_points ?? "—",
      row.aceita ?? "—",
      row.justificada ?? "—",
      row.recorrente ?? "—",
      row.horas_estimada ?? "—",
      row.horas_prevista ?? "—",
      row.homologado ?? "—",
      formatExportDate(row.criado_em),
      formatExportDate(row.fechado_em),
      row.lead_time_dias ?? "—",
      row.idade_dias ?? "—",
      row.sla_mais_90_dias ? "Sim" : "Não",
      resolveGitlabWorkItemUrl({
        gitlabRepo: row.gitlab_repo,
        gitlabIid: row.gitlab_iid,
      }) ?? "",
    ]);
    setIssueIidCell(dataRow.getCell(1), row);
    styleDataRow(dataRow);
    applyIssueEstadoExcelStyle(dataRow.getCell(estadoColIndex), row);
    if (statusLabel !== "—") {
      applyIssueStatusExcelStyle(dataRow.getCell(statusColIndex), statusLabel);
    }
  }

  await addIssueDistributionChartsSheet(workbook, rows, {
    title: `Distribuições — ${rows.length} issue(s) no recorte`,
  });

  return workbook.xlsx.writeBuffer();
}

export function buildIssuesExportFilename(total: number): string {
  const date = new Date().toISOString().slice(0, 10);
  return `issues-export-${date}-${total}-registros.xlsx`;
}
