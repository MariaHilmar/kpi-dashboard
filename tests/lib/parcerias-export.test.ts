import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import {
  buildParceriasExportFilename,
  buildParceriasExportWorkbook,
} from "@/lib/dashboard/parcerias-export";
import type { IssueRow } from "@/lib/dashboard/issues";
import { TODOS } from "@/lib/dashboard/constants";

async function loadWorkbook(workbook: ExcelJS.Workbook, buffer: unknown): Promise<void> {
  await workbook.xlsx.load(buffer as Parameters<typeof workbook.xlsx.load>[0]);
}

const SAMPLE_ROWS: IssueRow[] = [
  {
    total_count: 1,
    gitlab_iid: 500,
    gitlab_repo: "contratos_v2",
    titulo: "Demanda SEBRAE",
    modulo: "PNCP",
    area_funcional: "PNCP",
    tipo: "Melhoria",
    estado: "closed",
    status: "Delivered",
    prioridade: "Alta",
    equipe: "Alpha",
    parceria: "SEBRAE",
    sprint: "Sprint 1",
    epico: null,
    desenvolvedor: "Dev A",
    assignee: "Dev A",
    criado_em: "2026-05-01T10:00:00Z",
    fechado_em: "2026-06-15T10:00:00Z",
    entrega_prevista: "2026-06-20",
    lead_time_dias: 45,
    idade_dias: 0,
    sla_mais_90_dias: false,
  },
];

describe("buildParceriasExportWorkbook", () => {
  it("inclui colunas detalhadas do relatório", async () => {
    const buffer = await buildParceriasExportWorkbook({
      parceiro: TODOS,
      fechadoDe: "2026-06-01",
      fechadoAte: "2026-06-30",
      rows: SAMPLE_ROWS,
    });
    const workbook = new ExcelJS.Workbook();
    await loadWorkbook(workbook, buffer);

    const sheet = workbook.getWorksheet("Demandas");
    const header = sheet?.getRow(3).values as (string | undefined)[];
    expect(header).toContain("Parceria");
    expect(header).toContain("Módulo");
    expect(header).toContain("Tipo");
    expect(header).toContain("Estado");
    expect(header).toContain("Status");
    expect(header).toContain("Prioridade");
    expect(header).toContain("Criado em");
    expect(header).toContain("Data prevista");
    expect(header).toContain("Fechado em");
    expect(header).not.toContain("URL GitLab");

    expect(workbook.getWorksheet("Gráficos")).toBeDefined();
  });
});

describe("buildParceriasExportFilename", () => {
  it("inclui slug do recorte e total", () => {
    expect(buildParceriasExportFilename("SEBRAE", 3)).toMatch(
      /relatorio-parceria-sebrae-\d{4}-\d{2}-\d{2}-3-demandas\.xlsx$/,
    );
  });
});
