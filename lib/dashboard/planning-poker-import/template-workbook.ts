import ExcelJS from "exceljs";

import { TEMPLATE_HEADERS } from "@/lib/dashboard/planning-poker-import/constants";

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1351B4" },
};

const TEMPLATE_EXAMPLES: (string | number)[][] = [
  ["contratos_v2", 1349, "Sprint 91 - Contratos", 5, "Sim", "Não", "Não", 8, 10, "Sim", "Não", ""],
  ["contratos", 2617, "Sprint 90 - Contratos", 3, "Sim", "Não", "Não", 4, 6, "Não", "Não", "Aguardando PO"],
];

const HELP_LINES = [
  "Planning Poker — importação MGI",
  "",
  "Colunas obrigatórias: gitlab_repo, gitlab_iid",
  "Coluna principal: story_points (resultado da votação)",
  "",
  "gitlab_repo: contratos_v2 ou contratos",
  "gitlab_iid: número da issue no GitLab (#1349 → 1349)",
  "sprint: título do milestone (opcional)",
  "",
  "Importar pelo dashboard: Dados → Importar Dados",
];

function applyHeaderRow(sheet: ExcelJS.Worksheet): void {
  TEMPLATE_HEADERS.forEach((header, index) => {
    const cell = sheet.getCell(1, index + 1);
    cell.value = header;
    cell.fill = HEADER_FILL;
    cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
  });
}

function applyExampleRows(sheet: ExcelJS.Worksheet): void {
  TEMPLATE_EXAMPLES.forEach((example, rowIndex) => {
    example.forEach((value, colIndex) => {
      sheet.getCell(rowIndex + 2, colIndex + 1).value = value;
    });
  });
}

function applyColumnWidths(sheet: ExcelJS.Worksheet): void {
  sheet.getColumn(1).width = 14;
  sheet.getColumn(2).width = 12;
  sheet.getColumn(3).width = 28;
  sheet.getColumn(12).width = 36;
}

function addInstructionsSheet(workbook: ExcelJS.Workbook): void {
  const help = workbook.addWorksheet("Instrucoes");
  HELP_LINES.forEach((line, index) => {
    help.getCell(index + 1, 1).value = line;
  });
  help.getColumn(1).width = 72;
}

export async function buildPlanningPokerTemplateWorkbook(): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MGI KPI Dashboard";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Planning Poker");
  applyHeaderRow(sheet);
  applyExampleRows(sheet);
  applyColumnWidths(sheet);
  addInstructionsSheet(workbook);

  return workbook.xlsx.writeBuffer();
}
