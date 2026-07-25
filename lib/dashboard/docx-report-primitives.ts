import {
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

export const DOCX_A4 = { width: 11906, height: 16838 };
export const DOCX_MARGIN = 1134;

const HEADER_SHADING = "EFF3FB";
const BORDER = { style: BorderStyle.SINGLE, size: 1, color: "D9D9D9" };
export const DOCX_TABLE_BORDERS = {
  top: BORDER,
  bottom: BORDER,
  left: BORDER,
  right: BORDER,
  insideHorizontal: BORDER,
  insideVertical: BORDER,
};

export function docxHeaderCell(text: string, widthPct: number, right = false): TableCell {
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

export function docxBodyCell(text: string, widthPct: number, right = false): TableCell {
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

export function docxSectionHeading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, bold: true, size: 22 })],
  });
}

export function docxTwoColTable(rows: [string, string][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: DOCX_TABLE_BORDERS,
    rows: [
      new TableRow({
        children: [docxHeaderCell("Item", 70), docxHeaderCell("Valor", 30, true)],
        tableHeader: true,
      }),
      ...rows.map(
        ([a, b]) =>
          new TableRow({
            children: [docxBodyCell(a, 70), docxBodyCell(b, 30, true)],
          }),
      ),
    ],
  });
}

export function docxTableFrom(header: TableCell[], rows: TableRow[]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: DOCX_TABLE_BORDERS,
    rows: [new TableRow({ children: header, tableHeader: true }), ...rows],
  });
}
