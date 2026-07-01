import ExcelJS from "exceljs";

import { resolveGitlabWorkItemUrl } from "@/lib/dashboard/gitlab-url";
import type { AnalistaRelatorioSnapshot, AnalistaIssueRow } from "@/types/analistas";
import { formatAnoMesLabel } from "@/lib/dashboard/analistas-utils";

export type AnalistaExportParams = {
  analystName: string;
  anoMes: string;
  sprint: string;
  snapshot: AnalistaRelatorioSnapshot;
  outrasAtividades: string | null;
};

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

function issueIidCellValue(issue: AnalistaIssueRow): string | ExcelJS.CellHyperlinkValue {
  const label = issue.gitlab_iid != null ? `#${issue.gitlab_iid}` : "—";
  const url = resolveGitlabWorkItemUrl({
    gitlabRepo: issue.gitlab_repo,
    gitlabIid: issue.gitlab_iid,
    url: issue.url,
  });

  if (!url || label === "—") return label;
  return { text: label, hyperlink: url, tooltip: url };
}

function setIssueIidCell(cell: ExcelJS.Cell, issue: AnalistaIssueRow) {
  const value = issueIidCellValue(issue);
  cell.value = value;
  if (typeof value === "object" && value !== null && "hyperlink" in value) {
    cell.font = { size: 10, color: { argb: "FF1351B4" }, underline: true };
  }
}

/** Gera o workbook replicando o layout do relatório Excel manual (abas Painel + Dados). */
export async function buildAnalistaRelatorioWorkbook(
  params: AnalistaExportParams,
): Promise<ExcelJS.Buffer> {
  const { analystName, anoMes, sprint, snapshot, outrasAtividades } = params;
  const mesLabel = formatAnoMesLabel(anoMes);
  const { kpis, por_modulo, por_parceiro, issues } = snapshot;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MGI KPI Dashboard";
  workbook.created = new Date();

  // ---------------------------------------------------------------- Painel
  const painel = workbook.addWorksheet("Painel");
  painel.columns = [
    { width: 3 },
    { width: 22 },
    { width: 34 },
    { width: 16 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 22 },
    { width: 18 },
  ];

  painel.mergeCells("B2:I2");
  const title = painel.getCell("B2");
  title.value = `ATIVIDADES - ${analystName} ${mesLabel}`;
  title.font = { bold: true, size: 14 };
  title.alignment = { horizontal: "left" };

  painel.addRow([]);
  const kpiHeaderRow = painel.addRow([
    null,
    "Total de Issues",
    "Abertas",
    "Fechadas",
    "Canceladas",
    "Entregues",
    "Doing",
    "Sprint Atual",
  ]);
  styleHeaderRow(kpiHeaderRow);

  const kpiValueRow = painel.addRow([
    null,
    kpis.total,
    kpis.abertas,
    kpis.fechadas,
    kpis.canceladas,
    kpis.entregues,
    kpis.doing,
    kpis.sprint_atual ?? (sprint || "—"),
  ]);
  styleDataRow(kpiValueRow);

  painel.addRow([]);

  // Distribuição por módulo
  const moduloTitleRow = painel.addRow([null, null, "📁  Distribuição por Módulo"]);
  painel.mergeCells(`C${moduloTitleRow.number}:G${moduloTitleRow.number}`);
  moduloTitleRow.getCell(3).font = { bold: true, size: 11 };

  const moduloHeaderRow = painel.addRow([
    null,
    null,
    "Módulo / Fluxo",
    "Total",
    "Abertas",
    "Fechadas",
    "% Conclusão",
  ]);
  styleHeaderRow(moduloHeaderRow);

  for (const row of por_modulo) {
    styleDataRow(
      painel.addRow([null, null, row.label, row.total, row.abertas, row.fechadas, `${row.pct_conclusao}%`]),
    );
  }

  const moduloTotal = por_modulo.reduce(
    (acc, row) => ({
      total: acc.total + row.total,
      abertas: acc.abertas + row.abertas,
      fechadas: acc.fechadas + row.fechadas,
    }),
    { total: 0, abertas: 0, fechadas: 0 },
  );
  const moduloPct = moduloTotal.total > 0 ? Math.round((moduloTotal.fechadas / moduloTotal.total) * 100) : 0;
  const moduloTotalRow = painel.addRow([
    null,
    null,
    "TOTAL",
    moduloTotal.total,
    moduloTotal.abertas,
    moduloTotal.fechadas,
    `${moduloPct}%`,
  ]);
  styleHeaderRow(moduloTotalRow);

  painel.addRow([]);

  // Distribuição por parceiro
  const parceiroTitleRow = painel.addRow([null, null, "🤝  Distribuição por Parceiro"]);
  painel.mergeCells(`C${parceiroTitleRow.number}:G${parceiroTitleRow.number}`);
  parceiroTitleRow.getCell(3).font = { bold: true, size: 11 };

  const parceiroHeaderRow = painel.addRow([
    null,
    null,
    "Parceiro",
    "Total",
    "Abertas",
    "Fechadas",
    "% Conclusão",
  ]);
  styleHeaderRow(parceiroHeaderRow);

  for (const row of por_parceiro) {
    styleDataRow(
      painel.addRow([null, null, row.label, row.total, row.abertas, row.fechadas, `${row.pct_conclusao}%`]),
    );
  }

  const parceiroTotal = por_parceiro.reduce(
    (acc, row) => ({
      total: acc.total + row.total,
      abertas: acc.abertas + row.abertas,
      fechadas: acc.fechadas + row.fechadas,
    }),
    { total: 0, abertas: 0, fechadas: 0 },
  );
  const parceiroPct =
    parceiroTotal.total > 0 ? Math.round((parceiroTotal.fechadas / parceiroTotal.total) * 100) : 0;
  const parceiroTotalRow = painel.addRow([
    null,
    null,
    "TOTAL",
    parceiroTotal.total,
    parceiroTotal.abertas,
    parceiroTotal.fechadas,
    `${parceiroPct}%`,
  ]);
  styleHeaderRow(parceiroTotalRow);

  painel.addRow([]);

  // Lista de issues
  const issuesTitleRow = painel.addRow([null, "✅  Lista de Issues — Aberto × Concluído"]);
  painel.mergeCells(`B${issuesTitleRow.number}:I${issuesTitleRow.number}`);
  issuesTitleRow.getCell(2).font = { bold: true, size: 11 };

  const issuesHeaderRow = painel.addRow([
    null,
    "Issue (IID)",
    "Título",
    "Módulo",
    "Colaborador",
    "Status",
    "Status Label",
    "Parceiro",
    "Sprint",
  ]);
  styleHeaderRow(issuesHeaderRow);

  for (const issue of issues) {
    const dataRow = painel.addRow([
      null,
      issueIidCellValue(issue),
      issue.titulo ?? "—",
      issue.modulo ?? "—",
      issue.colaborador ?? "—",
      issue.status ?? "—",
      issue.status_label ?? "—",
      issue.parceiro ?? "—",
      issue.sprint ?? "—",
    ]);
    const issueCell = dataRow.getCell(2);
    if (typeof issueCell.value === "object" && issueCell.value !== null && "hyperlink" in issueCell.value) {
      issueCell.font = { size: 10, color: { argb: "FF1351B4" }, underline: true };
    }
    styleDataRow(dataRow);
  }

  const abertasCount = issues.filter((issue) => issue.status === "Aberta").length;
  const fechadasCount = issues.filter((issue) => issue.status === "Fechada").length;
  const summaryRow = painel.addRow([
    null,
    `Total Abertas: ${abertasCount}   |   Total Fechadas: ${fechadasCount}   |   Total: ${issues.length}`,
  ]);
  painel.mergeCells(`B${summaryRow.number}:I${summaryRow.number}`);

  painel.addRow([]);

  // Outras atividades
  const outrasTitleRow = painel.addRow([null, "✅  Outras Atividades"]);
  painel.mergeCells(`B${outrasTitleRow.number}:I${outrasTitleRow.number}`);
  outrasTitleRow.getCell(2).font = { bold: true, size: 11 };

  const outrasContentRow = painel.addRow([
    null,
    outrasAtividades?.trim() || "Nenhuma atividade adicional registrada.",
  ]);
  outrasContentRow.height = 90;
  const outrasCell = outrasContentRow.getCell(2);
  outrasCell.alignment = { wrapText: true, vertical: "top" };
  painel.mergeCells(`B${outrasContentRow.number}:I${outrasContentRow.number + 3}`);

  // ----------------------------------------------------------------- Dados
  const dados = workbook.addWorksheet("Dados");
  const dadosHeaderRow = dados.addRow([
    "Issue (IID)",
    "Título",
    "Módulo",
    "Colaborador",
    "Status",
    "Status Label",
    "Parceiro",
    "Sprint",
    "Data Criação",
    "URL",
  ]);
  styleHeaderRow(dadosHeaderRow);
  dados.columns = [
    { width: 12 },
    { width: 50 },
    { width: 16 },
    { width: 18 },
    { width: 10 },
    { width: 14 },
    { width: 14 },
    { width: 24 },
    { width: 14 },
    { width: 60 },
  ];

  for (const issue of issues) {
    const dataRow = dados.addRow([
      issueIidCellValue(issue),
      issue.titulo ?? "—",
      issue.modulo ?? "—",
      issue.colaborador ?? "—",
      issue.status ?? "—",
      issue.status_label ?? "—",
      issue.parceiro ?? "—",
      issue.sprint ?? "—",
      issue.criado_em ? new Date(issue.criado_em).toLocaleDateString("pt-BR") : "—",
      resolveGitlabWorkItemUrl({
        gitlabRepo: issue.gitlab_repo,
        gitlabIid: issue.gitlab_iid,
        url: issue.url,
      }) ?? "",
    ]);
    setIssueIidCell(dataRow.getCell(1), issue);
    styleDataRow(dataRow);
  }

  return workbook.xlsx.writeBuffer();
}
