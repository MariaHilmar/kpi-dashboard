import { describe, expect, it } from "vitest";

import { buildAnalistaRelatorioDocx } from "@/lib/dashboard/analistas-export-word";
import { buildAnalistaWordExportFilename } from "@/lib/dashboard/analistas-utils";
import type { AnalistaRelatorioSnapshot } from "@/types/analistas";

const SNAPSHOT: AnalistaRelatorioSnapshot = {
  kpis: {
    total: 2,
    abertas: 1,
    fechadas: 1,
    canceladas: 0,
    entregues: 0,
    doing: 1,
    sprint_atual: "Sprint 90 - Contratos",
  },
  por_tipo: [{ label: "Melhoria", total: 2, abertas: 1, fechadas: 1, pct_conclusao: 50 }],
  por_modulo: [
    { label: "Fiscalização", total: 2, abertas: 1, fechadas: 1, pct_conclusao: 50 },
  ],
  por_parceiro: [
    { label: "Sem Parceiro", total: 2, abertas: 1, fechadas: 1, pct_conclusao: 50 },
  ],
  issues: [
    {
      gitlab_iid: 1241,
      gitlab_repo: "Contratos v2",
      titulo: "Ajuste de tela",
      modulo: "Fiscalização",
      tipo: "Melhoria",
      colaborador: "Maria",
      status: "Aberta",
      status_label: "Doing",
      parceiro: "Sem Parceiro",
      epico: "Não informado",
      sprint: "Sprint 90",
      criado_em: "2026-06-10T00:00:00Z",
      url: null,
    },
  ],
};

describe("buildAnalistaRelatorioDocx", () => {
  it("gera um arquivo .docx (zip PK)", async () => {
    const buffer = await buildAnalistaRelatorioDocx({
      analystName: "Maria Hilmar",
      anoMes: "2026/06",
      sprint: "",
      snapshot: SNAPSHOT,
      outrasAtividades: "QA das issues 1241.",
    });

    expect(buffer.byteLength).toBeGreaterThan(1000);
    expect(String.fromCharCode(...buffer.subarray(0, 2))).toBe("PK");
  });

  it("gera docx com area de outras atividades mesmo sem texto salvo", async () => {
    const buffer = await buildAnalistaRelatorioDocx({
      analystName: "Analista",
      anoMes: "2026/06",
      sprint: "",
      snapshot: { ...SNAPSHOT, issues: [] },
      outrasAtividades: null,
    });

    expect(buffer.byteLength).toBeGreaterThan(500);
  });
});

describe("buildAnalistaWordExportFilename", () => {
  it("monta nome de arquivo .docx", () => {
    expect(buildAnalistaWordExportFilename("Maria Hilmar", "2026/06")).toBe(
      "Relatorio Atividades Maria Hilmar 06-2026.docx",
    );
  });
});
