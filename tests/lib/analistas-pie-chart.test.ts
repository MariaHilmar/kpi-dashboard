import { describe, expect, it } from "vitest";

import {
  aggregateDistribuicaoFromIssues,
  buildDistribuicaoPieChartPng,
} from "@/lib/dashboard/analistas-pie-chart";

describe("buildDistribuicaoPieChartPng", () => {
  it("gera PNG válido", async () => {
    const png = await buildDistribuicaoPieChartPng("Distribuição por tipo", [
      { label: "Melhoria", total: 3, abertas: 2, fechadas: 1, pct_conclusao: 33 },
      { label: "Bug", total: 1, abertas: 1, fechadas: 0, pct_conclusao: 0 },
    ]);

    expect(png.byteLength).toBeGreaterThan(500);
    expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  });

  it("gera PNG com fatia única (100%)", async () => {
    const png = await buildDistribuicaoPieChartPng("Distribuição por parceiro", [
      { label: "Parceiro A", total: 5, abertas: 2, fechadas: 3, pct_conclusao: 60 },
    ]);

    expect(png.byteLength).toBeGreaterThan(500);
    expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  });

  it("renderiza rótulos com acentuação em português", async () => {
    const png = await buildDistribuicaoPieChartPng("Distribuição por módulo", [
      { label: "Não informado", total: 2, abertas: 1, fechadas: 1, pct_conclusao: 50 },
    ]);

    expect(png.byteLength).toBeGreaterThan(3000);
  });
});

describe("aggregateDistribuicaoFromIssues", () => {
  it("agrupa issues por tipo", () => {
    const rows = aggregateDistribuicaoFromIssues(
      [
        { tipo: "Melhoria", modulo: "A", parceiro: "X" },
        { tipo: "Bug", modulo: "A", parceiro: "X" },
        { tipo: "Melhoria", modulo: "B", parceiro: "Y" },
      ],
      "tipo",
    );

    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.label === "Melhoria")?.total).toBe(2);
  });
});
