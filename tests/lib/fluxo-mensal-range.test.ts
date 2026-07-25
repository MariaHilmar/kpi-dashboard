import { describe, expect, it } from "vitest";

import {
  DEFAULT_EVOLUCAO_MENSAL_WINDOW,
  filterFluxoMensalByWindow,
  parseEvolucaoMensalWindow,
} from "@/lib/dashboard/fluxo-mensal-range";
import type { FluxoMensal } from "@/types/database";

const sample: FluxoMensal[] = [
  { mes: "2024/01", criados: 1, fechados: 0, backlog_liquido: 1, mergeadas: 0 },
  { mes: "2024/02", criados: 2, fechados: 1, backlog_liquido: 2, mergeadas: 1 },
  { mes: "2024/03", criados: 3, fechados: 2, backlog_liquido: 3, mergeadas: 1 },
  { mes: "2024/04", criados: 4, fechados: 3, backlog_liquido: 4, mergeadas: 2 },
  { mes: "2024/05", criados: 5, fechados: 4, backlog_liquido: 5, mergeadas: 2 },
  { mes: "2024/06", criados: 6, fechados: 5, backlog_liquido: 6, mergeadas: 3 },
];

describe("parseEvolucaoMensalWindow", () => {
  it("usa default quando valor inválido ou legado 1m", () => {
    expect(parseEvolucaoMensalWindow(null)).toBe(DEFAULT_EVOLUCAO_MENSAL_WINDOW);
    expect(parseEvolucaoMensalWindow("invalid")).toBe(DEFAULT_EVOLUCAO_MENSAL_WINDOW);
    expect(parseEvolucaoMensalWindow("1m")).toBe(DEFAULT_EVOLUCAO_MENSAL_WINDOW);
  });

  it("aceita janelas válidas", () => {
    expect(parseEvolucaoMensalWindow("6m")).toBe("6m");
    expect(parseEvolucaoMensalWindow("2y")).toBe("2y");
  });
});

describe("filterFluxoMensalByWindow", () => {
  it("mantém últimos 6 meses", () => {
    const filtered = filterFluxoMensalByWindow(sample, "6m");
    expect(filtered).toHaveLength(6);
    expect(filtered[0]?.mes).toBe("2024/01");
    expect(filtered.at(-1)?.mes).toBe("2024/06");
  });

  it("ordena antes de recortar", () => {
    const shuffled = [...sample].reverse();
    const filtered = filterFluxoMensalByWindow(shuffled, "6m");
    expect(filtered[0]?.mes).toBe("2024/01");
    expect(filtered.at(-1)?.mes).toBe("2024/06");
  });
});
