import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

import {
  DOCX_A4,
  DOCX_MARGIN,
  DOCX_TABLE_BORDERS,
  docxBodyCell,
  docxHeaderCell,
  docxSectionHeading,
  docxTwoColTable,
} from "@/lib/dashboard/docx-report-primitives";
import type { ExecutivoDataset } from "@/lib/dashboard/executivo-dataset";
import { formatPeriodoLabel } from "@/lib/dashboard/mergeadas-format";
import {
  mergeadasPivotDimensaoLabel,
  type MergeadasPivotDimensao,
} from "@/lib/dashboard/mergeadas-pivot";
import { recorteResumo, recorteFilenameSlug } from "@/lib/dashboard/recorte";
import { formatDecimal, formatNumber, formatPercentFixed } from "@/lib/format";
import type { ChartPoint, MergeadaPivotRow } from "@/types/database";

function chartTable(rows: ChartPoint[]): Table {
  return docxTwoColTable(rows.map((r) => [r.label, formatNumber(r.quantidade)]));
}

/** Monta o cabeçalho (Paragraph) + tabela de um pivô de mergeadas para uma dimensão. */
function pivotSection(
  dimensao: MergeadasPivotDimensao,
  periodos: string[],
  pivot: MergeadaPivotRow[],
): (Paragraph | Table)[] {
  const linhaHeader = mergeadasPivotDimensaoLabel(dimensao);
  const matrix = new Map<string, Map<string, number>>();
  for (const row of pivot) {
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

  return [
    docxSectionHeading(`Mergeadas por ${linhaHeader.toLowerCase()}`),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: DOCX_TABLE_BORDERS,
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            docxHeaderCell(linhaHeader, firstPct),
            ...periodos.map((p) => docxHeaderCell(formatPeriodoLabel(p), colPct, true)),
            docxHeaderCell("Total", 12, true),
          ],
        }),
        ...linhas.map(
          (l) =>
            new TableRow({
              children: [
                docxBodyCell(l.linha, firstPct),
                ...periodos.map((p) =>
                  docxBodyCell(formatNumber(l.cols.get(p) ?? 0), colPct, true),
                ),
                docxBodyCell(formatNumber(l.total), 12, true),
              ],
            }),
        ),
      ],
    }),
  ];
}

/** Relatório Word A4 com todas as seções do Executivo. */
export async function buildExecutivoRelatorioDocx(
  dataset: ExecutivoDataset,
): Promise<Buffer> {
  const k = dataset.kpis;
  const recorte = recorteResumo(dataset.filters);
  const children: (Paragraph | Table)[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [
        new TextRun({ text: "Dashboard Executivo", bold: true, size: 32 }),
      ],
    }),
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({ text: `Gerado em ${new Date().toLocaleString("pt-BR")}.`, size: 18, color: "666666" }),
      ],
    }),
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({ text: "Recorte: ", bold: true, size: 18 }),
        new TextRun({ text: recorte.periodo, size: 18 }),
      ],
    }),
    new Paragraph({
      spacing: { after: 220 },
      children: [
        new TextRun({ text: "Filtros: ", bold: true, size: 18 }),
        new TextRun({ text: recorte.filtrosTexto, size: 18 }),
      ],
    }),
  ];

  if (k) {
    children.push(
      docxSectionHeading("KPIs"),
      docxTwoColTable([
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

  children.push(docxSectionHeading("Evolução mensal"));
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: DOCX_TABLE_BORDERS,
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            docxHeaderCell("Mês", 20),
            docxHeaderCell("Criados", 20, true),
            docxHeaderCell("Fechados", 20, true),
            docxHeaderCell("Backlog", 20, true),
            docxHeaderCell("Mergeadas", 20, true),
          ],
        }),
        ...dataset.fluxoMensal.map(
          (row) =>
            new TableRow({
              children: [
                docxBodyCell(row.mes, 20),
                docxBodyCell(formatNumber(row.criados), 20, true),
                docxBodyCell(formatNumber(row.fechados), 20, true),
                docxBodyCell(formatNumber(row.backlog_liquido), 20, true),
                docxBodyCell(formatNumber(row.mergeadas), 20, true),
              ],
            }),
        ),
      ],
    }),
  );

  children.push(
    docxSectionHeading("Distribuição - Status"),
    chartTable(dataset.distribuicao.status),
    docxSectionHeading("Distribuição - Tipo"),
    chartTable(dataset.distribuicao.tipo),
    docxSectionHeading("Distribuição - Prioridade"),
    chartTable(dataset.distribuicao.prioridade),
    docxSectionHeading("Parcerias"),
    chartTable(dataset.detalhamento.parceria),
    docxSectionHeading("Módulos"),
    chartTable(dataset.detalhamento.modulos),
    docxSectionHeading("Área funcional"),
    chartTable(dataset.detalhamento.areaFuncional),
    docxSectionHeading("Equipes"),
    chartTable(dataset.detalhamento.equipes),
  );

  children.push(docxSectionHeading("KPI por tipo"));
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: DOCX_TABLE_BORDERS,
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            docxHeaderCell("Tipo", 28),
            docxHeaderCell("Total", 12, true),
            docxHeaderCell("Abertas", 12, true),
            docxHeaderCell("Fechadas", 12, true),
            docxHeaderCell("Taxa", 12, true),
            docxHeaderCell("Lead méd.", 12, true),
            docxHeaderCell("Lead med.", 12, true),
          ],
        }),
        ...dataset.detalhamento.kpisPorTipo.map(
          (row) =>
            new TableRow({
              children: [
                docxBodyCell(row.tipo, 28),
                docxBodyCell(formatNumber(row.total), 12, true),
                docxBodyCell(formatNumber(row.abertas), 12, true),
                docxBodyCell(formatNumber(row.fechadas), 12, true),
                docxBodyCell(formatPercentFixed(row.taxa_fechamento), 12, true),
                docxBodyCell(formatDecimal(row.lead_medio), 12, true),
                docxBodyCell(formatDecimal(row.lead_mediano), 12, true),
              ],
            }),
        ),
      ],
    }),
  );

  children.push(
    docxSectionHeading("Mergeadas por período (mês do merge)"),
    docxTwoColTable(
      dataset.mergeadas.porPeriodo.map((r) => [
        formatPeriodoLabel(r.periodo),
        formatNumber(r.total),
      ]),
    ),
    docxSectionHeading("Mergeadas por épico"),
    docxTwoColTable(
      dataset.mergeadas.porEpico.map((r) => [r.epico, formatNumber(r.total)]),
    ),
  );

  const periodos = dataset.mergeadas.periodos;
  children.push(
    ...pivotSection("modulo", periodos, dataset.mergeadas.pivots.modulo),
    ...pivotSection("epico", periodos, dataset.mergeadas.pivots.epico),
    ...pivotSection("parceria", periodos, dataset.mergeadas.pivots.parceria),
  );

  const doc = new Document({
    creator: "MGI KPI Dashboard",
    title: "Dashboard Executivo",
    sections: [
      {
        properties: {
          page: {
            size: { width: DOCX_A4.width, height: DOCX_A4.height },
            margin: {
              top: DOCX_MARGIN,
              bottom: DOCX_MARGIN,
              left: DOCX_MARGIN,
              right: DOCX_MARGIN,
            },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}

export function buildExecutivoWordFilename(dataset: ExecutivoDataset): string {
  return `executivo_${recorteFilenameSlug(dataset.filters)}.docx`;
}
