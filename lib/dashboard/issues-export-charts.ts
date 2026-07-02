import ExcelJS from "exceljs";

import {
  buildDistribuicaoPieChartPng,
  getDistribuicaoPieChartHeight,
} from "@/lib/dashboard/analistas-pie-chart";
import { NAO_INFORMADO } from "@/lib/dashboard/constants";
import { isIssueOpen } from "@/lib/dashboard/issue-state";
import { getIssueStatusChartHex, resolveIssueStatusLabel } from "@/lib/dashboard/issue-status";
import type { IssueRow } from "@/lib/dashboard/issues";
import type { AnalistaDistribuicaoRow } from "@/types/analistas";

const CHART_ROW_HEIGHT = 22;
/** Largura de cada pizza na aba Gráficos (dois gráficos lado a lado). */
const CHART_WIDTH_PX = 470;
const CHART_LEFT_COL = 1;
/** Antes col. 11 — aproximado ao fim do gráfico da esquerda. */
const CHART_RIGHT_COL = 7;

function configureChartsSheetColumns(sheet: ExcelJS.Worksheet): void {
  sheet.columns = [
    { width: 2 },
    { width: 24 },
    { width: 24 },
    { width: 24 },
    { width: 24 },
    { width: 24 },
    { width: 24 },
    { width: 2 },
    { width: 24 },
    { width: 24 },
    { width: 24 },
    { width: 24 },
    { width: 24 },
    { width: 24 },
  ];
}

export function aggregateIssueRows(
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
  colorForLabel?: (label: string, index: number) => string,
): Promise<number> {
  sheet.getRow(startRow).getCell(startCol).value = title;
  sheet.getRow(startRow).getCell(startCol).font = { bold: true, size: 12 };

  const png = await buildDistribuicaoPieChartPng(title, rows, { colorForLabel });
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

/** Aba com pizzas: status, tipo, prioridade e módulo. */
export async function addIssueDistributionChartsSheet(
  workbook: ExcelJS.Workbook,
  rows: IssueRow[],
  options?: { sheetName?: string; title?: string },
): Promise<void> {
  const sheetName = options?.sheetName ?? "Gráficos";
  const title = options?.title ?? `Distribuições — ${rows.length} demanda(s) no recorte`;

  const graficos = workbook.addWorksheet(sheetName);
  configureChartsSheetColumns(graficos);

  graficos.mergeCells("A2:N2");
  const titleCell = graficos.getCell("A2");
  titleCell.value = title;
  titleCell.font = { bold: true, size: 14 };

  const porStatus = aggregateIssueRows(
    rows,
    (row) => resolveIssueStatusLabel(row) || NAO_INFORMADO,
  );
  const porTipo = aggregateIssueRows(rows, (row) => row.tipo?.trim() || NAO_INFORMADO);
  const porPrioridade = aggregateIssueRows(
    rows,
    (row) => row.prioridade?.trim() || NAO_INFORMADO,
  );
  const porModulo = aggregateIssueRows(rows, (row) => row.modulo?.trim() || NAO_INFORMADO);

  const statusRowsUsed = await embedPieChart(
    workbook,
    graficos,
    "Distribuição por status",
    porStatus,
    4,
    CHART_LEFT_COL,
    (label) => getIssueStatusChartHex(label),
  );
  await embedPieChart(workbook, graficos, "Distribuição por tipo", porTipo, 4, CHART_RIGHT_COL);

  const secondRowStart = 4 + statusRowsUsed + 1;
  await embedPieChart(
    workbook,
    graficos,
    "Distribuição por prioridade",
    porPrioridade,
    secondRowStart,
    CHART_LEFT_COL,
  );
  await embedPieChart(workbook, graficos, "Distribuição por módulo", porModulo, secondRowStart, CHART_RIGHT_COL);
}
