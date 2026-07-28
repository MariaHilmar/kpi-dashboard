import ExcelJS from "exceljs";

import type { ExecutivoDataset } from "@/lib/dashboard/executivo-dataset";
import { formatPeriodoLabel } from "@/lib/dashboard/mergeadas-format";
import {
  buildPivotLinhas,
  mergeadasPivotDimensaoLabel,
  pivotPeriodTotals,
} from "@/lib/dashboard/mergeadas-pivot";
import { recorteResumo, recorteFilenameSlug } from "@/lib/dashboard/recorte";
import type { ChartPoint, KpiPorTipo, MergeadaPivotRow } from "@/types/database";

const ACCENT = "FF1351B4";
const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1351B4" } };
const STRIPE_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F6FC" } };
const TITLE_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF3FB" } };
const BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFDCE3F0" } },
  bottom: { style: "thin", color: { argb: "FFDCE3F0" } },
  left: { style: "thin", color: { argb: "FFDCE3F0" } },
  right: { style: "thin", color: { argb: "FFDCE3F0" } },
};

type Col = { name: string; width: number; fmt?: string };

/**
 * Planilha com cabeçalho estilizado + autoFilter (dropdowns de filtro), faixas
 * alternadas, cabeçalho congelado, formatação numérica e barras de dados opcionais.
 * Não usa addTable (que gera XML de tabela inválido no ExcelJS e corrompe o arquivo).
 */
function addDataTable(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  columns: Col[],
  rows: (string | number)[][],
  opts: { dataBarCol?: number; totalsRow?: (string | number)[] } = {},
): void {
  const sheet = workbook.addWorksheet(sheetName);
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  columns.forEach((c, i) => {
    const col = sheet.getColumn(i + 1);
    col.width = c.width;
    if (c.fmt) col.numFmt = c.fmt;
  });

  const header = sheet.addRow(columns.map((c) => c.name));
  header.eachCell((cell, ci) => {
    cell.font = { bold: true, size: 10, color: { argb: "FFFFFFFF" } };
    cell.fill = HEADER_FILL;
    cell.border = BORDER;
    cell.alignment = { vertical: "middle", horizontal: ci === 1 ? "left" : "right" };
  });

  const body = rows.length > 0 ? rows : [columns.map(() => "—")];
  body.forEach((r, ri) => {
    const row = sheet.addRow(r);
    row.eachCell((cell, ci) => {
      cell.border = BORDER;
      cell.font = { size: 10 };
      if (ri % 2 === 1) cell.fill = STRIPE_FILL;
      cell.alignment = { vertical: "middle", horizontal: ci === 1 ? "left" : "right" };
    });
  });

  const lastCol = sheet.getColumn(columns.length).letter;
  const lastRow = 1 + body.length;
  sheet.autoFilter = `A1:${lastCol}${lastRow}`;

  if (opts.dataBarCol != null && rows.length > 0) {
    const letter = sheet.getColumn(opts.dataBarCol + 1).letter;
    sheet.addConditionalFormatting({
      ref: `${letter}2:${letter}${rows.length + 1}`,
      rules: [
        {
          type: "dataBar",
          cfvo: [{ type: "min" }, { type: "max" }],
          color: { argb: ACCENT },
        } as unknown as ExcelJS.ConditionalFormattingRule,
      ],
    });
  }

  if (opts.totalsRow) {
    const row = sheet.addRow(opts.totalsRow);
    row.eachCell((cell, ci) => {
      cell.font = { bold: true, size: 10 };
      cell.border = BORDER;
      cell.alignment = { vertical: "middle", horizontal: ci === 1 ? "left" : "right" };
    });
  }
}

function num(value: number | null | undefined): number | string {
  return value === null || value === undefined ? "—" : value;
}

function chartRows(rows: ChartPoint[]): (string | number)[][] {
  return rows.map((r) => [r.label, r.quantidade]);
}

/** Primeira aba: título, geração e o recorte (período + filtros aplicados). */
function addCapaSheet(workbook: ExcelJS.Workbook, dataset: ExecutivoDataset): void {
  const sheet = workbook.addWorksheet("Capa");
  sheet.getColumn(1).width = 22;
  sheet.getColumn(2).width = 78;

  const recorte = recorteResumo(dataset.filters);
  const linhas: [string, string][] = [
    ["Relatório", "Dashboard Executivo — MGI KPI"],
    ["Gerado em", new Date().toLocaleString("pt-BR")],
    ["Período", recorte.periodo],
    ["Filtros aplicados", recorte.filtrosTexto],
    ["Total mergeadas no recorte", String(dataset.mergeadas.totalMergeadas)],
  ];

  const title = sheet.addRow(["Dashboard Executivo"]);
  title.font = { bold: true, size: 16, color: { argb: ACCENT } };
  sheet.addRow([]);

  for (const [label, value] of linhas) {
    const row = sheet.addRow([label, value]);
    row.getCell(1).font = { bold: true, size: 10 };
    row.getCell(1).fill = TITLE_FILL;
    row.getCell(2).font = { size: 10 };
    row.getCell(2).alignment = { wrapText: true, vertical: "top" };
  }
}

function addPivotSheet(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  linhaHeader: string,
  periodos: string[],
  pivot: MergeadaPivotRow[],
): void {
  const columns: Col[] = [
    { name: linhaHeader, width: 46 },
    ...periodos.map((p) => ({ name: formatPeriodoLabel(p), width: 11, fmt: "#,##0" })),
    { name: "Total", width: 12, fmt: "#,##0" },
  ];

  const linhas = buildPivotLinhas(pivot, periodos);
  const rows: (string | number)[][] = linhas.map((l) => [
    l.linha,
    ...periodos.map((p) => l.cols.get(p) ?? 0),
    l.total,
  ]);

  const totais = pivotPeriodTotals(linhas, periodos);
  const totalRow: (string | number)[] = ["Total", ...totais, totais.reduce((a, b) => a + b, 0)];

  addDataTable(workbook, sheetName, columns, rows, { totalsRow: totalRow });
}

/** Workbook Excel com TODAS as visões da página Executivo. */
export async function buildExecutivoExportWorkbook(
  dataset: ExecutivoDataset,
): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MGI KPI Dashboard";
  workbook.created = new Date();

  addCapaSheet(workbook, dataset);

  // KPIs
  const kpiRows: (string | number)[][] = [];
  if (dataset.kpis) {
    const k = dataset.kpis;
    kpiRows.push(
      ["Total", num(k.total)],
      ["Abertas", num(k.abertas)],
      ["Fechadas", num(k.fechadas)],
      ["Taxa fechamento (%)", num(k.taxa_fechamento)],
      ["Lead time médio (d)", num(k.lead_time_medio)],
      ["Bugs abertos", num(k.bugs_abertos)],
      ["Melhorias abertas", num(k.melhorias_abertas)],
      ["Sem tipo", num(k.sem_tipo)],
      ["% bugs no backlog", num(k.pct_bugs_backlog)],
      ["Taxa fech. bug (%)", num(k.taxa_fech_bug)],
      ["SLA > 90 dias", num(k.sla_acima_90)],
    );
  }
  addDataTable(
    workbook,
    "KPIs",
    [
      { name: "Indicador", width: 28 },
      { name: "Valor", width: 16, fmt: "#,##0.##" },
    ],
    kpiRows,
  );

  // Evolução mensal
  addDataTable(
    workbook,
    "Evolução mensal",
    [
      { name: "Mês", width: 14 },
      { name: "Criados", width: 12, fmt: "#,##0" },
      { name: "Fechados", width: 12, fmt: "#,##0" },
      { name: "Backlog líquido", width: 16, fmt: "#,##0" },
      { name: "Mergeadas", width: 12, fmt: "#,##0" },
    ],
    dataset.fluxoMensal.map((r) => [r.mes, r.criados, r.fechados, r.backlog_liquido, r.mergeadas]),
  );

  // Distribuição e detalhamento (com barras de dados na coluna de quantidade)
  const distcols: Col[] = [
    { name: "Rótulo", width: 40 },
    { name: "Quantidade", width: 16, fmt: "#,##0" },
  ];
  addDataTable(workbook, "Status", distcols, chartRows(dataset.distribuicao.status), { dataBarCol: 1 });
  addDataTable(workbook, "Tipo (distribuição)", distcols, chartRows(dataset.distribuicao.tipo), { dataBarCol: 1 });
  addDataTable(workbook, "Prioridade", distcols, chartRows(dataset.distribuicao.prioridade), { dataBarCol: 1 });
  addDataTable(workbook, "Parcerias", distcols, chartRows(dataset.detalhamento.parceria), { dataBarCol: 1 });
  addDataTable(workbook, "Módulos", distcols, chartRows(dataset.detalhamento.modulos), { dataBarCol: 1 });
  addDataTable(workbook, "Área funcional", distcols, chartRows(dataset.detalhamento.areaFuncional), { dataBarCol: 1 });
  addDataTable(workbook, "Equipes", distcols, chartRows(dataset.detalhamento.equipes), { dataBarCol: 1 });

  // Lead time por módulo
  addDataTable(
    workbook,
    "Lead time por módulo",
    [
      { name: "Módulo", width: 28 },
      { name: "Itens", width: 12, fmt: "#,##0" },
      { name: "Lead médio", width: 14, fmt: "#,##0.0" },
      { name: "Lead mediano", width: 14, fmt: "#,##0.0" },
    ],
    dataset.detalhamento.leadTimePorModulo.map((r) => [
      r.modulo,
      r.itens,
      num(r.lead_medio),
      num(r.lead_mediano),
    ]),
  );

  // KPI por tipo
  addDataTable(
    workbook,
    "KPI por tipo",
    [
      { name: "Tipo", width: 24 },
      { name: "Total", width: 12, fmt: "#,##0" },
      { name: "Abertas", width: 12, fmt: "#,##0" },
      { name: "Fechadas", width: 12, fmt: "#,##0" },
      { name: "Taxa fech. (%)", width: 14, fmt: "#,##0.0" },
      { name: "Lead médio (d)", width: 14, fmt: "#,##0.0" },
      { name: "Lead mediano (d)", width: 16, fmt: "#,##0.0" },
    ],
    dataset.detalhamento.kpisPorTipo.map((r: KpiPorTipo) => [
      r.tipo,
      r.total,
      r.abertas,
      r.fechadas,
      r.taxa_fechamento,
      num(r.lead_medio),
      num(r.lead_mediano),
    ]),
  );

  // Mergeadas por dimensão (matriz por mês): Módulo, Épico e Parceria
  addPivotSheet(workbook, "Mergeadas por Módulo", mergeadasPivotDimensaoLabel("modulo"), dataset.mergeadas.periodos, dataset.mergeadas.pivots.modulo);
  addPivotSheet(workbook, "Mergeadas por Épico", mergeadasPivotDimensaoLabel("epico"), dataset.mergeadas.periodos, dataset.mergeadas.pivots.epico);
  addPivotSheet(workbook, "Mergeadas por Parceria", mergeadasPivotDimensaoLabel("parceria"), dataset.mergeadas.periodos, dataset.mergeadas.pivots.parceria);

  return workbook.xlsx.writeBuffer();
}

export function buildExecutivoExportFilename(dataset: ExecutivoDataset): string {
  return `executivo_${recorteFilenameSlug(dataset.filters)}.xlsx`;
}
