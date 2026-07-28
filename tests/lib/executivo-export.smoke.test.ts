import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import type { ExecutivoDataset } from "@/lib/dashboard/executivo-dataset";
import {
  buildExecutivoExportFilename,
  buildExecutivoExportWorkbook,
} from "@/lib/dashboard/executivo-export";
import {
  buildExecutivoRelatorioDocx,
  buildExecutivoWordFilename,
} from "@/lib/dashboard/executivo-export-word";
import { DEFAULT_FILTERS } from "@/lib/dashboard/filters";

const point = (label: string, q: number) => ({ label, quantidade: q });

const dataset: ExecutivoDataset = {
  kpis: {
    total: 100, abertas: 40, fechadas: 60, taxa_fechamento: 60, lead_time_medio: 12.4,
    bugs_abertos: 5, melhorias_abertas: 30, sem_tipo: 2, pct_bugs_backlog: 12.5,
    taxa_fech_bug: 70, sla_acima_90: 3,
  } as ExecutivoDataset["kpis"],
  fluxoMensal: [
    { mes: "2026/06", criados: 10, fechados: 8, backlog_liquido: 2, mergeadas: 6 },
    { mes: "2026/07", criados: 12, fechados: 14, backlog_liquido: -2, mergeadas: 9 },
  ],
  distribuicao: {
    status: [point("Em andamento", 30), point("Concluído", 50)],
    tipo: [point("Bug", 20), point("Melhoria", 60)],
    prioridade: [point("Alta", 10)],
  },
  detalhamento: {
    parceria: [point("SEBRAE", 40), point("BCB", 25)],
    modulos: [point("Fiscalização", 33)],
    areaFuncional: [point("PNCP", 12)],
    equipes: [point("Alpha", 18)],
    leadTimePorModulo: [{ modulo: "Fiscalização", itens: 10, lead_medio: 9.1, lead_mediano: 7 }],
    kpisPorTipo: [
      { tipo: "Bug", total: 20, abertas: 5, fechadas: 15, taxa_fechamento: 75, lead_medio: 6.2, lead_mediano: 5 },
    ],
  },
  mergeadas: {
    porPeriodo: [
      { periodo: "2026/06", total: 6 },
      { periodo: "2026/07", total: 9 },
    ],
    porEpico: [{ epico: "Checklist de fiscalização", total: 12 }],
    pivots: {
      modulo: [{ linha: "Fiscalização", periodo: "2026/07", total: 9 }],
      epico: [{ linha: "Checklist", periodo: "2026/07", total: 9 }],
      parceria: [{ linha: "SEBRAE", periodo: "2026/07", total: 5 }],
    },
    periodos: ["2026/06", "2026/07"],
    totalMergeadas: 15,
  },
  filters: {
    ...DEFAULT_FILTERS,
    periodoTipo: "fechamento",
    periodoDe: "2026-01-27",
    periodoAte: "2026-07-27",
    fechadoDe: "2026-01-27",
    fechadoAte: "2026-07-27",
    parceria: "SEBRAE",
  },
} as ExecutivoDataset;

describe("buildExecutivoExportWorkbook (smoke)", () => {
  it("gera um .xlsx sem erro de runtime", async () => {
    const buffer = await buildExecutivoExportWorkbook(dataset);
    expect(buffer.byteLength).toBeGreaterThan(2000);
  });

  it("o .xlsx gerado é estruturalmente válido (recarrega sem erro)", async () => {
    const buffer = await buildExecutivoExportWorkbook(dataset);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as ArrayBuffer);
    // abas esperadas presentes
    const names = wb.worksheets.map((w) => w.name);
    expect(names).toContain("Capa");
    expect(names).toContain("Mergeadas por Parceria");
    expect(names).not.toContain("Mergeadas por período");
    expect(names).not.toContain("Mergeadas por épico");
    // cabeçalho da Capa
    expect(wb.getWorksheet("Capa")?.getCell("A1").value).toBe("Dashboard Executivo");
  });

  it("nome do arquivo reflete o recorte", () => {
    expect(buildExecutivoExportFilename(dataset)).toBe(
      "executivo_fechamento_2026-01-27_a_2026-07-27.xlsx",
    );
  });
});

describe("buildExecutivoRelatorioDocx (smoke)", () => {
  it("gera um .docx sem erro de runtime", async () => {
    const buffer = await buildExecutivoRelatorioDocx(dataset);
    expect(buffer.byteLength).toBeGreaterThan(2000);
  });

  it("nome do Word reflete o recorte", () => {
    expect(buildExecutivoWordFilename(dataset)).toBe(
      "executivo_fechamento_2026-01-27_a_2026-07-27.docx",
    );
  });
});
