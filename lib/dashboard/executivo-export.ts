import ExcelJS from "exceljs";

import type { ExecutivoDataset } from "@/lib/dashboard/executivo-dataset";
import { formatPeriodoLabel } from "@/lib/dashboard/mergeadas-format";
import type { ChartPoint, KpiPorTipo, MergeadaPivotRow } from "@/types/database";

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

function num(value: number | null | undefined): number | string {
  return value === null || value === undefined ? "—" : value;
}

function addChartSheet(workbook: ExcelJS.Workbook, name: string, rows: ChartPoint[]) {
  const sheet = workbook.addWorksheet(name);
  sheet.columns = [{ width: 40 }, { width: 14 }];
  styleHeaderRow(sheet.addRow(["Label", "Quantidade"]));
  for (const row of rows) {
    styleDataRow(sheet.addRow([row.label, row.quantidade]));
  }
}

function addPivotSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  linhaHeader: string,
  periodos: string[],
  pivot: MergeadaPivotRow[],
) {
  const sheet = workbook.addWorksheet(name);
  const headers = [linhaHeader, ...periodos.map(formatPeriodoLabel), "Total"];
  sheet.columns = [{ width: 48 }, ...periodos.map(() => ({ width: 12 })), { width: 12 }];
  styleHeaderRow(sheet.addRow(headers));

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

  for (const l of linhas) {
    styleDataRow(
      sheet.addRow([
        l.linha,
        ...periodos.map((p) => l.cols.get(p) ?? 0),
        l.total,
      ]),
    );
  }

  const totais = periodos.map((p) =>
    linhas.reduce((acc, l) => acc + (l.cols.get(p) ?? 0), 0),
  );
  styleDataRow(
    sheet.addRow(["Total", ...totais, totais.reduce((a, b) => a + b, 0)]),
  );
}

function addKpisPorTipoSheet(workbook: ExcelJS.Workbook, rows: KpiPorTipo[]) {
  const sheet = workbook.addWorksheet("KPI por tipo");
  sheet.columns = [
    { width: 24 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
  ];
  styleHeaderRow(
    sheet.addRow([
      "Tipo",
      "Total",
      "Abertas",
      "Fechadas",
      "Taxa fech. (%)",
      "Lead médio (d)",
      "Lead mediano (d)",
    ]),
  );
  for (const row of rows) {
    styleDataRow(
      sheet.addRow([
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
}

/** Workbook Excel com TODAS as visões da página Executivo. */
export async function buildExecutivoExportWorkbook(
  dataset: ExecutivoDataset,
): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MGI KPI Dashboard";
  workbook.created = new Date();

  // KPIs
  const kpis = workbook.addWorksheet("KPIs");
  kpis.columns = [{ width: 28 }, { width: 16 }];
  styleHeaderRow(kpis.addRow(["Indicador", "Valor"]));
  if (dataset.kpis) {
    const k = dataset.kpis;
    const rows: [string, number | null][] = [
      ["Total", k.total],
      ["Abertas", k.abertas],
      ["Fechadas", k.fechadas],
      ["Taxa fechamento (%)", k.taxa_fechamento],
      ["Lead time médio (d)", k.lead_time_medio],
      ["Bugs abertos", k.bugs_abertos],
      ["Melhorias abertas", k.melhorias_abertas],
      ["Sem tipo", k.sem_tipo],
      ["% bugs no backlog", k.pct_bugs_backlog],
      ["Taxa fech. bug (%)", k.taxa_fech_bug],
      ["SLA > 90 dias", k.sla_acima_90],
    ];
    for (const [label, value] of rows) {
      styleDataRow(kpis.addRow([label, num(value)]));
    }
  }

  // Evolução mensal
  const fluxo = workbook.addWorksheet("Evolução mensal");
  fluxo.columns = [
    { width: 14 },
    { width: 12 },
    { width: 12 },
    { width: 16 },
    { width: 12 },
  ];
  styleHeaderRow(
    fluxo.addRow(["Mês", "Criados", "Fechados", "Backlog líquido", "Mergeadas"]),
  );
  for (const row of dataset.fluxoMensal) {
    styleDataRow(
      fluxo.addRow([
        row.mes,
        row.criados,
        row.fechados,
        row.backlog_liquido,
        row.mergeadas,
      ]),
    );
  }

  // Distribuição
  addChartSheet(workbook, "Status", dataset.distribuicao.status);
  addChartSheet(workbook, "Tipo (distribuição)", dataset.distribuicao.tipo);
  addChartSheet(workbook, "Prioridade", dataset.distribuicao.prioridade);

  // Detalhamento
  addChartSheet(workbook, "Parcerias", dataset.detalhamento.parceria);
  addChartSheet(workbook, "Módulos", dataset.detalhamento.modulos);
  addChartSheet(workbook, "Área funcional", dataset.detalhamento.areaFuncional);
  addChartSheet(workbook, "Equipes", dataset.detalhamento.equipes);

  const lead = workbook.addWorksheet("Lead time por módulo");
  lead.columns = [{ width: 28 }, { width: 12 }, { width: 14 }, { width: 14 }];
  styleHeaderRow(lead.addRow(["Módulo", "Itens", "Lead médio", "Lead mediano"]));
  for (const row of dataset.detalhamento.leadTimePorModulo) {
    styleDataRow(
      lead.addRow([row.modulo, row.itens, num(row.lead_medio), num(row.lead_mediano)]),
    );
  }

  addKpisPorTipoSheet(workbook, dataset.detalhamento.kpisPorTipo);

  // Mergeadas
  const periodo = workbook.addWorksheet("Mergeadas por período");
  periodo.columns = [{ width: 16 }, { width: 16 }];
  styleHeaderRow(periodo.addRow(["Período (mês do merge)", "Mergeadas"]));
  for (const row of dataset.mergeadas.porPeriodo) {
    styleDataRow(periodo.addRow([formatPeriodoLabel(row.periodo), row.total]));
  }
  styleDataRow(periodo.addRow(["Total", dataset.mergeadas.totalMergeadas]));

  const epico = workbook.addWorksheet("Mergeadas por épico");
  epico.columns = [{ width: 70 }, { width: 16 }];
  styleHeaderRow(epico.addRow(["Épico", "Mergeadas"]));
  for (const row of dataset.mergeadas.porEpico) {
    styleDataRow(epico.addRow([row.epico, row.total]));
  }

  addPivotSheet(
    workbook,
    "Mergeadas pivot 6m",
    dataset.mergeadas.porModulo ? "Módulo" : "Épico",
    dataset.mergeadas.periodos,
    dataset.mergeadas.pivot,
  );

  return workbook.xlsx.writeBuffer();
}

export function buildExecutivoExportFilename(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `executivo-${date}.xlsx`;
}
