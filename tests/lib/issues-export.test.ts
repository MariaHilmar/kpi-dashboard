import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

async function loadWorkbook(workbook: ExcelJS.Workbook, buffer: unknown): Promise<void> {
  await workbook.xlsx.load(buffer as Parameters<typeof workbook.xlsx.load>[0]);
}

import {
  buildIssuesExportFilename,
  buildIssuesExportWorkbook,
} from "@/lib/dashboard/issues-export";
import type { IssueRow } from "@/lib/dashboard/issues";

const SAMPLE_ROWS: IssueRow[] = [
  {
    total_count: 2,
    gitlab_iid: 100,
    gitlab_repo: "contratos_v2",
    titulo: "Issue A",
    modulo: "PNCP",
    area_funcional: "PNCP",
    tipo: "Melhoria",
    estado: "open",
    status: "Em andamento",
    prioridade: "high",
    equipe: "Alpha",
    parceria: "BCB",
    sprint: "Sprint 1",
    epico: "Épico 1",
    desenvolvedor: "Dev A",
    assignee: "Assignee A",
    criado_em: "2024-06-01T10:00:00Z",
    fechado_em: null,
    entrega_prevista: null,
    lead_time_dias: null,
    idade_dias: 10,
    sla_mais_90_dias: false,
  },
  {
    total_count: 2,
    gitlab_iid: 101,
    gitlab_repo: "contratos_v2",
    titulo: "Issue B",
    modulo: "Fiscalização",
    area_funcional: "Fiscal",
    tipo: "Bug",
    estado: "closed",
    status: "Concluída",
    prioridade: "medium",
    equipe: "Beta",
    parceria: null,
    sprint: "Sprint 2",
    epico: null,
    desenvolvedor: "Dev B",
    assignee: "Assignee B",
    criado_em: "2024-05-01T10:00:00Z",
    fechado_em: "2024-06-15T10:00:00Z",
    entrega_prevista: "2024-06-20",
    lead_time_dias: 45,
    idade_dias: 0,
    sla_mais_90_dias: true,
  },
];

describe("buildIssuesExportWorkbook", () => {
  it("gera abas Dados e Gráficos", async () => {
    const buffer = await buildIssuesExportWorkbook(SAMPLE_ROWS);
    const workbook = new ExcelJS.Workbook();
    await loadWorkbook(workbook, buffer);

    expect(workbook.getWorksheet("Dados")).toBeDefined();
    expect(workbook.getWorksheet("Gráficos")).toBeDefined();
  });

  it("inclui todas as colunas de resultado na aba Dados", async () => {
    const buffer = await buildIssuesExportWorkbook(SAMPLE_ROWS);
    const workbook = new ExcelJS.Workbook();
    await loadWorkbook(workbook, buffer);

    const dados = workbook.getWorksheet("Dados");
    const header = dados?.getRow(1).values as (string | undefined)[];
    expect(header).toContain("Parceria");
    expect(header).toContain("Fechado em");
    expect(header).toContain("Estado");
    expect(header).toContain("Status");
    expect(header).toContain("Módulo");

    const row2 = dados?.getRow(2).values as (string | undefined)[];
    expect(row2).toContain("BCB");
    expect(row2).toContain("Issue A");
  });

  it("gera buffer xlsx não vazio", async () => {
    const buffer = await buildIssuesExportWorkbook(SAMPLE_ROWS);
    expect(buffer.byteLength).toBeGreaterThan(5000);
  });
});

describe("buildIssuesExportFilename", () => {
  it("inclui total de registros", () => {
    expect(buildIssuesExportFilename(42)).toMatch(/42-registros\.xlsx$/);
  });
});
