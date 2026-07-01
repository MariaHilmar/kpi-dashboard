import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

import { resolveGitlabWorkItemUrl } from "@/lib/dashboard/gitlab-url";

import type { AnalistaDistribuicaoRow, AnalistaIssueRow } from "@/types/analistas";
import {
  buildDistribuicaoPieChartPng,
  getDistribuicaoPieChartHeight,
  resolveDistribuicaoRows,
} from "@/lib/dashboard/analistas-pie-chart";
import { formatAnoMesPeriodoLabel } from "@/lib/dashboard/analistas-utils";
import type { AnalistaExportParams } from "@/lib/dashboard/analistas-export";

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

function headerCell(text: string, widthPct?: number): TableCell {
  return new TableCell({
    width: widthPct ? { size: widthPct, type: WidthType.PERCENTAGE } : undefined,
    shading: { fill: HEADER_SHADING, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, size: 18 })],
      }),
    ],
  });
}

function bodyCell(text: string, widthPct?: number): TableCell {
  return new TableCell({
    width: widthPct ? { size: widthPct, type: WidthType.PERCENTAGE } : undefined,
    margins: { top: 60, bottom: 60, left: 120, right: 120 },
    children: [
      new Paragraph({
        children: [new TextRun({ text, size: 18 })],
      }),
    ],
  });
}

function issueBodyCell(row: AnalistaIssueRow, widthPct?: number): TableCell {
  const label = row.gitlab_iid != null ? `#${row.gitlab_iid}` : "—";
  const url = resolveGitlabWorkItemUrl({
    gitlabRepo: row.gitlab_repo,
    gitlabIid: row.gitlab_iid,
    url: row.url,
  });

  const children =
    url && row.gitlab_iid != null
      ? [
          new ExternalHyperlink({
            children: [new TextRun({ text: label, style: "Hyperlink", size: 18 })],
            link: url,
          }),
        ]
      : [new TextRun({ text: label, size: 18 })];

  return new TableCell({
    width: widthPct ? { size: widthPct, type: WidthType.PERCENTAGE } : undefined,
    margins: { top: 60, bottom: 60, left: 120, right: 120 },
    children: [new Paragraph({ children })],
  });
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 160 },
    children: [new TextRun({ text, bold: true, size: 24 })],
  });
}

function buildDistribuicaoDataTable(rows: AnalistaDistribuicaoRow[]): Table {
  const slices = rows.filter((row) => row.total > 0);
  const sum = slices.reduce((acc, row) => acc + row.total, 0);

  const header = new TableRow({
    children: [
      headerCell("Categoria", 58),
      headerCell("Quantidade", 22),
      headerCell("%", 20),
    ],
  });

  const dataRows =
    slices.length === 0
      ? [
          new TableRow({
            children: [
              new TableCell({
                columnSpan: 3,
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: "Sem dados para o recorte selecionado.",
                        italics: true,
                        size: 18,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ]
      : slices.map((row) => {
          const pct = sum > 0 ? Math.round((row.total / sum) * 100) : 0;
          return new TableRow({
            children: [
              bodyCell(row.label, 58),
              bodyCell(String(row.total), 22),
              bodyCell(`${pct}%`, 20),
            ],
          });
        });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TABLE_BORDERS,
    rows: [header, ...dataRows],
  });
}

async function buildDistribuicaoSection(
  title: string,
  rows: AnalistaDistribuicaoRow[],
): Promise<(Paragraph | Table)[]> {
  const chartPng = await buildDistribuicaoPieChartPng(title, rows);
  const chartHeight = getDistribuicaoPieChartHeight(rows);
  const displayWidth = 480;
  const displayHeight = Math.round((displayWidth * chartHeight) / 640);

  return [
    sectionHeading(title),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [
        new ImageRun({
          type: "png",
          data: chartPng,
          transformation: { width: displayWidth, height: displayHeight },
        }),
      ],
    }),
    buildDistribuicaoDataTable(rows),
    new Paragraph({ spacing: { after: 240 }, children: [] }),
  ];
}

function buildIssuesTable(issues: AnalistaIssueRow[]): Table {
  const header = new TableRow({
    children: [
      headerCell("Issue", 10),
      headerCell("Título", 34),
      headerCell("Módulo", 14),
      headerCell("Tipo", 12),
      headerCell("Parceiro", 14),
      headerCell("Épico", 16),
    ],
  });

  const dataRows =
    issues.length === 0
      ? [
          new TableRow({
            children: [
              new TableCell({
                columnSpan: 6,
                margins: { top: 100, bottom: 100, left: 120, right: 120 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: "Nenhuma issue encontrada para o período selecionado.",
                        italics: true,
                        size: 18,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ]
      : issues.map(
          (row) =>
            new TableRow({
              children: [
                issueBodyCell(row, 10),
                bodyCell(row.titulo ?? "—", 34),
                bodyCell(row.modulo ?? "—", 14),
                bodyCell(row.tipo ?? "—", 12),
                bodyCell(row.parceiro ?? "—", 14),
                bodyCell(row.epico ?? "—", 16),
              ],
            }),
        );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TABLE_BORDERS,
    rows: [header, ...dataRows],
  });
}

function buildOutrasAtividadesSection(outrasAtividades: string | null): (Paragraph | Table)[] {
  const saved = outrasAtividades?.trim();
  const placeholder =
    "Espaço para descrever outras atividades do período (QA, criação de protótipos, bpmn, geração de atas, etc.):";

  if (saved) {
    return [
      sectionHeading("Outras atividades"),
      ...saved.split(/\r?\n/).map(
        (line) =>
          new Paragraph({
            spacing: { after: 80 },
            children: [new TextRun({ text: line, size: 20 })],
          }),
      ),
    ];
  }

  const lines = ["", "", "", "", ""];

  return [
    sectionHeading("Outras atividades"),
    new Paragraph({
      spacing: { after: 120 },
      children: [new TextRun({ text: placeholder, italics: true, size: 20 })],
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: TABLE_BORDERS,
      rows: lines.map(
        () =>
          new TableRow({
            children: [
              new TableCell({
                margins: { top: 160, bottom: 160, left: 160, right: 160 },
                children: [new Paragraph({ children: [new TextRun({ text: " ", size: 20 })] })],
              }),
            ],
          }),
      ),
    }),
  ];
}

function buildReportHeader(analystName: string, anoMes: string): Paragraph[] {
  const periodo = formatAnoMesPeriodoLabel(anoMes);

  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: "RELATÓRIO MENSAL DE ATIVIDADES",
          bold: true,
          size: 32,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text: "Projeto Contratos – MGI", size: 22 })],
    }),
    new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text: `Período: ${periodo}`, size: 22 })],
    }),
    new Paragraph({
      spacing: { after: 240 },
      children: [new TextRun({ text: `Analista: ${analystName}`, size: 22 })],
    }),
    new Paragraph({
      spacing: { before: 120, after: 120 },
      children: [new TextRun({ text: "Objetivo", bold: true, size: 24 })],
    }),
    new Paragraph({
      spacing: { after: 320 },
      children: [
        new TextRun({
          text: "Apresentar as atividades executadas durante o período, evidenciadas a partir das issues criadas no GitLab e das demais atividades descritas.",
          size: 22,
        }),
      ],
    }),
  ];
}

/** Relatório Word conforme modelo institucional (distribuições + gráficos pizza). */
export async function buildAnalistaRelatorioDocx(params: AnalistaExportParams): Promise<Buffer> {
  const { analystName, anoMes, snapshot, outrasAtividades } = params;
  const periodo = formatAnoMesPeriodoLabel(anoMes);
  const { por_tipo, por_modulo, por_parceiro, issues } = snapshot;

  const tipoRows = resolveDistribuicaoRows(por_tipo, issues, "tipo");
  const parceiroRows = resolveDistribuicaoRows(por_parceiro, issues, "parceiro");
  const moduloRows = resolveDistribuicaoRows(por_modulo, issues, "modulo");

  const [tipoSection, parceiroSection, moduloSection] = await Promise.all([
    buildDistribuicaoSection("Distribuição por tipo", tipoRows),
    buildDistribuicaoSection("Distribuição por parceiro", parceiroRows),
    buildDistribuicaoSection("Distribuição por módulo", moduloRows),
  ]);

  const doc = new Document({
    creator: "MGI KPI Dashboard",
    title: `Relatório Mensal de Atividades — ${analystName} ${periodo}`,
    sections: [
      {
        properties: {},
        children: [
          ...buildReportHeader(analystName, anoMes),
          sectionHeading("Lista de Issues Criadas"),
          buildIssuesTable(issues),
          ...buildOutrasAtividadesSection(outrasAtividades),
          ...tipoSection,
          ...parceiroSection,
          ...moduloSection,
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
