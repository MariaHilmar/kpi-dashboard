import ExcelJS from "exceljs";

import {
  buildDistribuicaoPieChartPng,
  getDistribuicaoPieChartHeight,
} from "@/lib/dashboard/analistas-pie-chart";
import { NAO_INFORMADO } from "@/lib/dashboard/constants";
import { resolveGitlabWorkItemUrl } from "@/lib/dashboard/gitlab-url";
import { isIssueOpen, issueEstadoLabel } from "@/lib/dashboard/issue-state";
import type { IssueRow } from "@/lib/dashboard/issues";
import type { AnalistaDistribuicaoRow } from "@/types/analistas";

const THIN_BORDER: ExcelJS.Border = { style: "thin", color: { argb: "FFD9D9D9" } };
const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFEFF3FB" },
};

const CHART_WIDTH_PX = 520;
const CHART_ROW_HEIGHT = 22;

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

function issueStatusLabel(row: IssueRow): string {
  return row.status?.trim() || issueEstadoLabel(row.estado);
}

function aggregateIssues(
  rows: IssueRow[],
  getLabel: (row: IssueRow) => string,
): AnalistaDistribuicaoRow[] {
  const counts = new Map<string, { total: number; abertas: number; fechadas: number }>();

  for (const row of rows) {
    const label = getLabel(row);
    const current = counts.get(label) ?? { total: 0, abertas: 0, fechadas: 0 };
    current.total += 1;
    if (isIssueOpen(row.estado)) {
      current.abertas += 1;
    } else {
      current.fechadas += 1;
    }
    counts.set(label, current);
  }

  return Array.from(counts.entries())
    .sort(([, a], [, b]) => b.total - a.total || a.abertas - b.abertas)
    .map(([label, stats]) => ({
      label,
      total: stats.total,
      abertas: stats.abertas,
      fechadas: stats.fechadas,
      pct_conclusao: stats.total > 0 ? Math.round((stats.fechadas / stats.total) * 100) : 0,
    }));
}

async function embedPieChart(
  workbook: ExcelJS.Workbook,
  sheet: ExcelJS.Worksheet,
  title: string,
  rows: AnalistaDistribuicaoRow[],
  startRow: number,
  startCol: number,
): Promise<number> {
  sheet.getRow(startRow).getCell(startCol).value = title;
  sheet.getRow(startRow).getCell(startCol).font = { bold: true, size: 12 };

  const png = await buildDistribuicaoPieChartPng(title, rows);
  const imageId = workbook.addImage({
    base64: png.toString("base64"),
    extension: "png",
  });

  const heightPx = getDistribuicaoPieChartHeight(rows);
  sheet.addImage(imageId, {
    tl: { col: startCol - 1, row: startRow },
    ext: { width: CHART_WIDTH_PX, height: heightPx },
  });

  return Math.ceil(heightPx / CHART_ROW_HEIGHT) + 2;
}

/** Gera workbook Excel com abas Dados (todas as colunas) e Gráficos (pizzas). */
export async function buildIssuesExportWorkbook(rows: IssueRow[]): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MGI KPI Dashboard";
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
    { width: 10 },
    { width: 18 },
    { width: 12 },
    { width: 14 },
    { width: 16 },
    { width: 14 },
    { width: 16 },
    { width: 18 },
    { width: 18 },
    { width: 12 },
    { width: 12 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 50 },
  ];

  for (const row of rows) {
    const dataRow = dados.addRow([
      issueIidCellValue(row),
      row.titulo ?? "—",
      row.modulo ?? "—",
      row.area_funcional ?? "—",
      row.tipo ?? "—",
      issueEstadoLabel(row.estado),
      issueStatusLabel(row),
      row.prioridade ?? "—",
      row.equipe ?? "—",
      row.parceria ?? "—",
      row.sprint ?? "—",
      row.epico ?? "—",
      row.desenvolvedor ?? "—",
      row.assignee ?? "—",
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
  }

  const graficos = workbook.addWorksheet("Gráficos");
  graficos.columns = [{ width: 4 }, { width: 70 }, { width: 4 }, { width: 70 }];

  graficos.mergeCells("B2:E2");
  const titleCell = graficos.getCell("B2");
  titleCell.value = `Distribuições — ${rows.length} issue(s) no recorte`;
  titleCell.font = { bold: true, size: 14 };

  const porStatus = aggregateIssues(rows, (row) => issueStatusLabel(row) || NAO_INFORMADO);
  const porTipo = aggregateIssues(rows, (row) => row.tipo?.trim() || NAO_INFORMADO);
  const porPrioridade = aggregateIssues(
    rows,
    (row) => row.prioridade?.trim() || NAO_INFORMADO,
  );
  const porModulo = aggregateIssues(rows, (row) => row.modulo?.trim() || NAO_INFORMADO);

  const statusRowsUsed = await embedPieChart(
    workbook,
    graficos,
    "Distribuição por status",
    porStatus,
    4,
    1,
  );
  await embedPieChart(workbook, graficos, "Distribuição por tipo", porTipo, 4, 11);

  const secondRowStart = 4 + statusRowsUsed + 1;
  await embedPieChart(
    workbook,
    graficos,
    "Distribuição por prioridade",
    porPrioridade,
    secondRowStart,
    1,
  );
  await embedPieChart(workbook, graficos, "Distribuição por módulo", porModulo, secondRowStart, 11);

  return workbook.xlsx.writeBuffer();
}

export function buildIssuesExportFilename(total: number): string {
  const date = new Date().toISOString().slice(0, 10);
  return `issues-export-${date}-${total}-registros.xlsx`;
}
