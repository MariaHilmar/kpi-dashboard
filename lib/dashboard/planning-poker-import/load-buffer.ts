import ExcelJS from "exceljs";

import { parseSheetRows } from "@/lib/dashboard/planning-poker-import/sheet-rows";
import type { PlanningPokerRow } from "@/lib/dashboard/planning-poker-import/types";

function parseCsvBuffer(buffer: ArrayBuffer): PlanningPokerRow[] {
  const text = new TextDecoder("utf-8").decode(buffer).replace(/^\uFEFF/, "");
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) throw new Error("CSV vazio");

  const headers = lines[0].split(",").map((cell) => cell.trim());
  const dataRows = lines.slice(1).map((line) => line.split(",").map((cell) => cell.trim()));
  return parseSheetRows(headers, dataRows);
}

async function parseExcelBuffer(buffer: ArrayBuffer): Promise<PlanningPokerRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error("Excel sem planilhas");

  const headerRow = sheet.getRow(1);
  const rawHeaderValues = headerRow.values;
  const headerCells = Array.isArray(rawHeaderValues) ? rawHeaderValues.slice(1) : [];
  const headers = headerCells
    .map((cell) => String(cell ?? "").trim())
    .filter(Boolean);

  if (headers.length === 0) throw new Error("Excel sem cabeçalho na primeira linha");

  const dataRows: unknown[][] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const rawRowValues = row.values;
    const values = (Array.isArray(rawRowValues) ? rawRowValues.slice(1) : []).map((cell) => {
      if (cell && typeof cell === "object" && "result" in cell) {
        return (cell as ExcelJS.CellFormulaValue).result ?? "";
      }
      return cell ?? "";
    });
    dataRows.push(values);
  });

  return parseSheetRows(headers, dataRows);
}

export async function loadPlanningPokerFromBuffer(
  buffer: ArrayBuffer,
  filename: string,
): Promise<PlanningPokerRow[]> {
  const suffix = filename.split(".").pop()?.toLowerCase() ?? "";

  if (suffix === "csv") {
    return parseCsvBuffer(buffer);
  }

  if (suffix === "xlsx" || suffix === "xlsm") {
    return parseExcelBuffer(buffer);
  }

  throw new Error("Formato não suportado (use .xlsx ou .csv)");
}
