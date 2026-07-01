import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

/**
 * exceljs declara um `Buffer` ambiente que colide com tipagens recentes de
 * @types/node; usamos `Parameters<>` para herdar o tipo exato esperado sem
 * referenciar o símbolo `Buffer` (que dispara TS2345 nesta combinação de libs).
 */
async function loadWorkbook(workbook: ExcelJS.Workbook, buffer: unknown): Promise<void> {
  await workbook.xlsx.load(buffer as Parameters<typeof workbook.xlsx.load>[0]);
}

import { buildAnalistaRelatorioWorkbook } from "@/lib/dashboard/analistas-export";
import { buildAnalistaExportFilename } from "@/lib/dashboard/analistas-utils";
import type { AnalistaRelatorioSnapshot } from "@/types/analistas";

const SNAPSHOT: AnalistaRelatorioSnapshot = {
  kpis: {
    total: 6,
    abertas: 6,
    fechadas: 0,
    canceladas: 0,
    entregues: 1,
    doing: 1,
    sprint_atual: "Sprint 89 - Contratos",
  },
  por_tipo: [{ label: "Melhoria", total: 6, abertas: 6, fechadas: 0, pct_conclusao: 0 }],
  por_modulo: [
    { label: "Fiscalização", total: 6, abertas: 6, fechadas: 0, pct_conclusao: 0 },
  ],
  por_parceiro: [
    { label: "Sem Parceiro", total: 6, abertas: 6, fechadas: 0, pct_conclusao: 0 },
  ],
  issues: [
    {
      gitlab_iid: 1241,
      gitlab_repo: "Contratos v1",
      titulo: "Ajuste de tela",
      modulo: "Fiscalização",
      tipo: "Melhoria",
      colaborador: "Maria",
      status: "Aberta",
      status_label: "Doing",
      parceiro: "Sem Parceiro",
      epico: "Não informado",
      sprint: "Sprint 89",
      criado_em: "2026-05-10T00:00:00Z",
      url: "https://gitlab.com/comprasnet/contratos/-/work_items/1241",
    },
  ],
};

describe("buildAnalistaRelatorioWorkbook", () => {
  it("gera um workbook com abas Painel e Dados", async () => {
    const buffer = await buildAnalistaRelatorioWorkbook({
      analystName: "Maria Hilmar",
      anoMes: "2026/05",
      sprint: "",
      snapshot: SNAPSHOT,
      outrasAtividades: "QA das issues 1241 e 1230.",
    });

    const workbook = new ExcelJS.Workbook();
    await loadWorkbook(workbook, buffer);

    const sheetNames = workbook.worksheets.map((sheet) => sheet.name);
    expect(sheetNames).toEqual(["Painel", "Dados"]);

    const painel = workbook.getWorksheet("Painel");
    expect(painel?.getCell("B2").value).toContain("Maria Hilmar");
    expect(painel?.getCell("B2").value).toContain("05/2026");

    const dados = workbook.getWorksheet("Dados");
    const issueCell = dados?.getCell("A2");
    expect(issueCell?.value).toMatchObject({
      text: "#1241",
      hyperlink: "https://gitlab.com/comprasnet/contratos/-/work_items/1241",
    });
  });

  it("usa texto padrão quando não há outras atividades", async () => {
    const buffer = await buildAnalistaRelatorioWorkbook({
      analystName: "Analista",
      anoMes: "2026/05",
      sprint: "",
      snapshot: { ...SNAPSHOT, issues: [] },
      outrasAtividades: null,
    });

    const workbook = new ExcelJS.Workbook();
    await loadWorkbook(workbook, buffer);
    const painel = workbook.getWorksheet("Painel");

    const values = painel?.getSheetValues().flatMap((row) => (Array.isArray(row) ? row : []));
    expect(values?.some((value) => value === "Nenhuma atividade adicional registrada.")).toBe(true);
  });
});

describe("buildAnalistaExportFilename", () => {
  it("monta nome de arquivo a partir do analista e mes", () => {
    expect(buildAnalistaExportFilename("Maria Hilmar", "2026/05")).toBe(
      "Relatorio Atividades Maria Hilmar 05-2026.xlsx",
    );
  });
});
