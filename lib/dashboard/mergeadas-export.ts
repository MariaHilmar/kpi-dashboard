import ExcelJS from "exceljs";

import { formatPeriodoLabel } from "@/lib/dashboard/mergeadas-format";
import { type MergeadasDataset } from "@/lib/dashboard/mergeadas";

const THIN_BORDER: ExcelJS.Border = { style: "thin", color: { argb: "FFD9D9D9" } };
const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFEFF3FB" },
};

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

function num(value: number | null): number | string {
  return value === null || value === undefined ? "—" : value;
}

/** Workbook com abas: Mergeadas por período, Mergeadas por épico e KPI por tipo. */
export async function buildMergeadasExportWorkbook(
  dataset: MergeadasDataset,
): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MGI KPI Dashboard";
  workbook.created = new Date();

  // --- Mergeadas por período -------------------------------------------------
  const periodo = workbook.addWorksheet("Mergeadas por período");
  periodo.columns = [{ width: 16 }, { width: 16 }];
  styleHeaderRow(periodo.addRow(["Período (mês/ano criação)", "Mergeadas"]));
  for (const row of dataset.porPeriodo) {
    styleDataRow(periodo.addRow([formatPeriodoLabel(row.periodo), row.total]));
  }
  styleDataRow(periodo.addRow(["Total", dataset.totalMergeadas]));

  // --- Mergeadas por épico ---------------------------------------------------
  const epico = workbook.addWorksheet("Mergeadas por épico");
  epico.columns = [{ width: 70 }, { width: 16 }];
  styleHeaderRow(epico.addRow(["Épico", "Mergeadas"]));
  for (const row of dataset.porEpico) {
    styleDataRow(epico.addRow([row.epico, row.total]));
  }

  // --- KPI por tipo (todos os tipos, inclusive zero) -------------------------
  const tipo = workbook.addWorksheet("KPI por tipo");
  tipo.columns = [
    { width: 24 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
  ];
  styleHeaderRow(
    tipo.addRow([
      "Tipo",
      "Total",
      "Abertas",
      "Fechadas",
      "Taxa fech. (%)",
      "Lead médio (d)",
      "Lead mediano (d)",
    ]),
  );
  for (const row of dataset.kpisPorTipo) {
    styleDataRow(
      tipo.addRow([
        row.tipo,
        row.total,
        row.abertas,
        row.fechadas,
        row.taxa_fechamento,
        num(row.lead_medio),
        num(row.lead_mediano),
      ]),
    );
  }

  return workbook.xlsx.writeBuffer();
}

export function buildMergeadasExportFilename(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `mergeadas-executivo-${date}.xlsx`;
}
