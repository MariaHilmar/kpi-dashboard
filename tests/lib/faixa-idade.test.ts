import { describe, expect, it } from "vitest";

import { normalizeFaixaIdadeRows } from "@/lib/dashboard/faixa-idade";

describe("normalizeFaixaIdadeRows", () => {
  it("preenche faixas vazias e recalcula percentuais", () => {
    const rows = normalizeFaixaIdadeRows([
      { faixa: "91-120 dias", qtde: 5, percentual: 50 },
      { faixa: "121-180 dias", qtde: 2, percentual: 20 },
    ]);

    expect(rows.find((row) => row.faixa === "0-30 dias")).toEqual({
      faixa: "0-30 dias",
      qtde: 0,
      percentual: 0,
    });
    expect(rows.find((row) => row.faixa === "91-120 dias")).toEqual({
      faixa: "91-120 dias",
      qtde: 5,
      percentual: 71.43,
    });
    expect(rows.find((row) => row.faixa === "121-180 dias")).toEqual({
      faixa: "121-180 dias",
      qtde: 2,
      percentual: 28.57,
    });
  });

  it("preserva faixa legada da RPC e recalcula percentuais", () => {
    const rows = normalizeFaixaIdadeRows([
      { faixa: "0-30 dias", qtde: 118, percentual: 14.9 },
      { faixa: "Mais de 120 dias", qtde: 512, percentual: 64.7 },
    ]);

    expect(rows.find((row) => row.faixa === "Mais de 120 dias")).toEqual({
      faixa: "Mais de 120 dias",
      qtde: 512,
      percentual: 81.27,
    });
    expect(rows.reduce((sum, row) => sum + row.percentual, 0)).toBeCloseTo(100, 1);
  });

  it("normaliza alias Mais de um ano", () => {
    const rows = normalizeFaixaIdadeRows([
      { faixa: "Mais de um ano", qtde: 10, percentual: 100 },
    ]);

    expect(rows.find((row) => row.faixa === "Mais de 1 ano")).toEqual({
      faixa: "Mais de 1 ano",
      qtde: 10,
      percentual: 100,
    });
  });
});
