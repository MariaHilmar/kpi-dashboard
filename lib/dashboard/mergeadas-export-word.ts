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

import { formatDecimal, formatPercentFixed } from "@/lib/format";
import { formatPeriodoLabel } from "@/lib/dashboard/mergeadas-format";
import { type MergeadasDataset } from "@/lib/dashboard/mergeadas";

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

// A4 retrato em twips (210mm x 297mm) e margens de 2cm.
const A4 = { width: 11906, height: 16838 };
const MARGIN = 1134;

function headerCell(text: string, widthPct: number, right = false): TableCell {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: { fill: HEADER_SHADING, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [
      new Paragraph({
        alignment: right ? AlignmentType.RIGHT : AlignmentType.LEFT,
        children: [new TextRun({ text, bold: true, size: 18 })],
      }),
    ],
  });
}

function bodyCell(text: string, widthPct: number, right = false): TableCell {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    margins: { top: 60, bottom: 60, left: 120, right: 120 },
    children: [
      new Paragraph({
        alignment: right ? AlignmentType.RIGHT : AlignmentType.LEFT,
        children: [new TextRun({ text, size: 18 })],
      }),
    ],
  });
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 160 },
    children: [new TextRun({ text, bold: true, size: 24 })],
  });
}

function tableFrom(header: TableCell[], rows: TableRow[]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TABLE_BORDERS,
    rows: [new TableRow({ children: header, tableHeader: true }), ...rows],
  });
}

function buildPorPeriodo(dataset: MergeadasDataset): (Paragraph | Table)[] {
  const rows = dataset.porPeriodo.map(
    (row) =>
      new TableRow({
        children: [
          bodyCell(formatPeriodoLabel(row.periodo), 70),
          bodyCell(String(row.total), 30, true),
        ],
      }),
  );
  rows.push(
    new TableRow({
      children: [
        new TableCell({
          width: { size: 70, type: WidthType.PERCENTAGE },
          shading: { fill: HEADER_SHADING, type: ShadingType.CLEAR },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: "Total", bold: true, size: 18 })] })],
        }),
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          shading: { fill: HEADER_SHADING, type: ShadingType.CLEAR },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: String(dataset.totalMergeadas), bold: true, size: 18 })],
            }),
          ],
        }),
      ],
    }),
  );

  return [
    sectionHeading("Mergeadas por período (mês/ano de criação)"),
    tableFrom([headerCell("Período", 70), headerCell("Mergeadas", 30, true)], rows),
  ];
}

function buildPorEpico(dataset: MergeadasDataset): (Paragraph | Table)[] {
  const rows =
    dataset.porEpico.length === 0
      ? [
          new TableRow({
            children: [
              new TableCell({
                columnSpan: 2,
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({ text: "Sem issues mergeadas no recorte.", italics: true, size: 18 }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ]
      : dataset.porEpico.map(
          (row) =>
            new TableRow({
              children: [bodyCell(row.epico, 82), bodyCell(String(row.total), 18, true)],
            }),
        );

  return [
    sectionHeading("Mergeadas por épico"),
    tableFrom([headerCell("Épico", 82), headerCell("Mergeadas", 18, true)], rows),
  ];
}

function buildPorTipo(dataset: MergeadasDataset): (Paragraph | Table)[] {
  const rows = dataset.kpisPorTipo.map(
    (row) =>
      new TableRow({
        children: [
          bodyCell(row.tipo, 28),
          bodyCell(String(row.total), 12, true),
          bodyCell(String(row.abertas), 12, true),
          bodyCell(String(row.fechadas), 12, true),
          bodyCell(formatPercentFixed(row.taxa_fechamento), 12, true),
          bodyCell(formatDecimal(row.lead_medio), 12, true),
          bodyCell(formatDecimal(row.lead_mediano), 12, true),
        ],
      }),
  );

  return [
    sectionHeading("KPI por tipo (todos os tipos, inclusive zero)"),
    tableFrom(
      [
        headerCell("Tipo", 28),
        headerCell("Total", 12, true),
        headerCell("Abertas", 12, true),
        headerCell("Fechadas", 12, true),
        headerCell("Taxa fech.", 12, true),
        headerCell("Lead médio", 12, true),
        headerCell("Lead mediano", 12, true),
      ],
      rows,
    ),
  ];
}

/** Relatório Word A4 com as três visões novas do Executivo. */
export async function buildMergeadasRelatorioDocx(dataset: MergeadasDataset): Promise<Buffer> {
  const doc = new Document({
    creator: "MGI KPI Dashboard",
    title: "Mergeadas — Dashboard Executivo",
    sections: [
      {
        properties: {
          page: {
            size: { width: A4.width, height: A4.height },
            margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [
              new TextRun({ text: "DASHBOARD EXECUTIVO — MERGEADAS", bold: true, size: 32 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 240 },
            children: [
              new TextRun({
                text: `Gerado em ${new Date().toLocaleString("pt-BR")}.`,
                size: 20,
              }),
            ],
          }),
          ...buildPorPeriodo(dataset),
          ...buildPorEpico(dataset),
          ...buildPorTipo(dataset),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

export function buildMergeadasWordFilename(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `mergeadas-executivo-${date}.docx`;
}
