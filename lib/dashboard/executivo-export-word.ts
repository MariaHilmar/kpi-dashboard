import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

import type { ExecutivoDataset } from "@/lib/dashboard/executivo-dataset";
import { formatPeriodoLabel } from "@/lib/dashboard/mergeadas-format";
import { formatDecimal, formatNumber, formatPercentFixed } from "@/lib/format";
import type { ChartPoint } from "@/types/database";

const HEADER_SHADING = "EFF3FB";
const BORDER = { style: BorderStyle.SINGLE, size: 1, color: "D9D9D9" };
const TABLE_BORDERS = {
  top: BORDER,
  bottom: BORDER,
  left: BORDER,
  right: BORDER,
  insideHorizontal: BORDER,
  insideVertical: BORDER,
};

const A4 = { width: 11906, height: 16838 };
const MARGIN = 1134;

function headerCell(text: string, widthPct: number, right = false): TableCell {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: { fill: HEADER_SHADING, type: ShadingType.CLEAR },
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    children: [
      new Paragraph({
        alignment: right ? AlignmentType.RIGHT : AlignmentType.LEFT,
        children: [new TextRun({ text, bold: true, size: 16 })],
      }),
    ],
  });
}

function bodyCell(text: string, widthPct: number, right = false): TableCell {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
    children: [
      new Paragraph({
        alignment: right ? AlignmentType.RIGHT : AlignmentType.LEFT,
        children: [new TextRun({ text, size: 16 })],
      }),
    ],
  });
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, bold: true, size: 22 })],
  });
}

function twoColTable(rows: [string, string][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TABLE_BORDERS,
    rows: [
      new TableRow({
        children: [headerCell("Item", 70), headerCell("Valor", 30, true)],
        tableHeader: true,
      }),
      ...rows.map(
        ([a, b]) =>
          new TableRow({
            children: [bodyCell(a, 70), bodyCell(b, 30, true)],
          }),
      ),
    ],
  });
}

function chartTable(rows: ChartPoint[]): Table {
  return twoColTable(rows.map((r) => [r.label, formatNumber(r.quantidade)]));
}

/** Relatório Word A4 com todas as seções do Executivo. */
export async function buildExecutivoRelatorioDocx(
  dataset: ExecutivoDataset,
): Promise<Buffer> {
  const k = dataset.kpis;
  const children: (Paragraph | Table)[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({ text: "DASHBOARD EXECUTIVO", bold: true, size: 32 }),
      ],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: `Gerado em ${new Date().toLocaleString("pt-BR")}.`,
          size: 18,
        }),
      ],
    }),
  ];

  if (k) {
    children.push(
      sectionHeading("KPIs"),
      twoColTable([
        ["Total", formatNumber(k.total)],
        ["Abertas", formatNumber(k.abertas)],
        ["Fechadas", formatNumber(k.fechadas)],
        ["Taxa fechamento", formatPercentFixed(k.taxa_fechamento)],
        ["Lead time médio", formatDecimal(k.lead_time_medio)],
        ["Bugs abertos", formatNumber(k.bugs_abertos)],
        ["Melhorias abertas", formatNumber(k.melhorias_abertas)],
        ["% bugs no backlog", formatPercentFixed(k.pct_bugs_backlog)],
        ["Taxa fech. bug", formatPercentFixed(k.taxa_fech_bug)],
        ["SLA > 90 dias", formatNumber(k.sla_acima_90)],
      ]),
    );
  }

  children.push(sectionHeading("Evolução mensal"));
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: TABLE_BORDERS,
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            headerCell("Mês", 20),
            headerCell("Criados", 20, true),
            headerCell("Fechados", 20, true),
            headerCell("Backlog", 20, true),
            headerCell("Mergeadas", 20, true),
          ],
        }),
        ...dataset.fluxoMensal.map(
          (row) =>
            new TableRow({
              children: [
                bodyCell(row.mes, 20),
                bodyCell(formatNumber(row.criados), 20, true),
                bodyCell(formatNumber(row.fechados), 20, true),
                bodyCell(formatNumber(row.backlog_liquido), 20, true),
                bodyCell(formatNumber(row.mergeadas), 20, true),
              ],
            }),
        ),
      ],
    }),
  );

  children.push(
    sectionHeading("Distribuição - Status"),
    chartTable(dataset.distribuicao.status),
    sectionHeading("Distribuição - Tipo"),
    chartTable(dataset.distribuicao.tipo),
    sectionHeading("Distribuição - Prioridade"),
    chartTable(dataset.distribuicao.prioridade),
    sectionHeading("Parcerias"),
    chartTable(dataset.detalhamento.parceria),
    sectionHeading("Módulos"),
    chartTable(dataset.detalhamento.modulos),
    sectionHeading("Área funcional"),
    chartTable(dataset.detalhamento.areaFuncional),
    sectionHeading("Equipes"),
    chartTable(dataset.detalhamento.equipes),
  );

  children.push(sectionHeading("KPI por tipo"));
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: TABLE_BORDERS,
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            headerCell("Tipo", 28),
            headerCell("Total", 12, true),
            headerCell("Abertas", 12, true),
            headerCell("Fechadas", 12, true),
            headerCell("Taxa", 12, true),
            headerCell("Lead méd.", 12, true),
            headerCell("Lead med.", 12, true),
          ],
        }),
        ...dataset.detalhamento.kpisPorTipo.map(
          (row) =>
            new TableRow({
              children: [
                bodyCell(row.tipo, 28),
                bodyCell(formatNumber(row.total), 12, true),
                bodyCell(formatNumber(row.abertas), 12, true),
                bodyCell(formatNumber(row.fechadas), 12, true),
                bodyCell(formatPercentFixed(row.taxa_fechamento), 12, true),
                bodyCell(formatDecimal(row.lead_medio), 12, true),
                bodyCell(formatDecimal(row.lead_mediano), 12, true),
              ],
            }),
        ),
      ],
    }),
  );

  children.push(
    sectionHeading("Mergeadas por período (mês do merge)"),
    twoColTable(
      dataset.mergeadas.porPeriodo.map((r) => [
        formatPeriodoLabel(r.periodo),
        formatNumber(r.total),
      ]),
    ),
    sectionHeading("Mergeadas por épico"),
    twoColTable(
      dataset.mergeadas.porEpico.map((r) => [r.epico, formatNumber(r.total)]),
    ),
  );

  // Pivot 6 meses
  const periodos = dataset.mergeadas.periodos;
  const linhaHeader = dataset.mergeadas.porModulo ? "Módulo" : "Épico";
  const matrix = new Map<string, Map<string, number>>();
  for (const row of dataset.mergeadas.pivot) {
    if (!matrix.has(row.linha)) matrix.set(row.linha, new Map());
    matrix.get(row.linha)!.set(row.periodo, row.total);
  }
  const linhas = Array.from(matrix.entries())
    .map(([linha, cols]) => {
      const total = periodos.reduce((acc, p) => acc + (cols.get(p) ?? 0), 0);
      return { linha, cols, total };
    })
    .sort((a, b) => b.total - a.total || a.linha.localeCompare(b.linha, "pt-BR"));

  const colPct = Math.floor(60 / Math.max(periodos.length, 1));
  const firstPct = 100 - colPct * periodos.length - 12;

  children.push(sectionHeading(`Mergeadas por ${linhaHeader.toLowerCase()} (últimos 6 meses)`));
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: TABLE_BORDERS,
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            headerCell(linhaHeader, firstPct),
            ...periodos.map((p) => headerCell(formatPeriodoLabel(p), colPct, true)),
            headerCell("Total", 12, true),
          ],
        }),
        ...linhas.map(
          (l) =>
            new TableRow({
              children: [
                bodyCell(l.linha, firstPct),
                ...periodos.map((p) =>
                  bodyCell(formatNumber(l.cols.get(p) ?? 0), colPct, true),
                ),
                bodyCell(formatNumber(l.total), 12, true),
              ],
            }),
        ),
      ],
    }),
  );

  const doc = new Document({
    creator: "MGI KPI Dashboard",
    title: "Dashboard Executivo",
    sections: [
      {
        properties: {
          page: {
            size: { width: A4.width, height: A4.height },
            margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}

export function buildExecutivoWordFilename(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `executivo-${date}.docx`;
}
