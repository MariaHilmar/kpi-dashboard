import { describe, expect, it } from "vitest";

import { DEFAULT_FILTERS } from "@/lib/dashboard/filters";
import {
  mergeadasPivotPeriodKeys,
  mergeadasPivotSubtitle,
  mergeadasPivotTableTitle,
  parseMergeadasPivotDimensao,
} from "@/lib/dashboard/mergeadas-pivot";

describe("parseMergeadasPivotDimensao", () => {
  it("usa épico como padrão", () => {
    expect(parseMergeadasPivotDimensao(null)).toBe("epico");
    expect(parseMergeadasPivotDimensao("invalid")).toBe("epico");
  });

  it("aceita módulo", () => {
    expect(parseMergeadasPivotDimensao("modulo")).toBe("modulo");
  });

  it("aceita parceria", () => {
    expect(parseMergeadasPivotDimensao("parceria")).toBe("parceria");
  });
});

describe("mergeadasPivotPeriodKeys", () => {
  it("retorna 6 meses quando período global está vazio", () => {
    const keys = mergeadasPivotPeriodKeys(DEFAULT_FILTERS, new Date("2026-07-15"));
    expect(keys).toEqual([
      "2026/02",
      "2026/03",
      "2026/04",
      "2026/05",
      "2026/06",
      "2026/07",
    ]);
  });

  it("usa meses do período global quando informado", () => {
    const keys = mergeadasPivotPeriodKeys({
      ...DEFAULT_FILTERS,
      periodoTipo: "merge",
      periodoDe: "2026-03-10",
      periodoAte: "2026-05-20",
      mergeadoDe: "2026-03-10",
      mergeadoAte: "2026-05-20",
    });
    expect(keys).toEqual(["2026/03", "2026/04", "2026/05"]);
  });
});

describe("mergeadasPivotTableTitle", () => {
  it("menciona últimos 6 meses sem período global", () => {
    expect(mergeadasPivotTableTitle(DEFAULT_FILTERS)).toContain("últimos 6 meses");
  });

  it("omite últimos 6 meses com período global", () => {
    expect(
      mergeadasPivotTableTitle({
        ...DEFAULT_FILTERS,
        periodoDe: "2026-01-01",
        periodoAte: "2026-06-30",
        mergeadoDe: "2026-01-01",
        mergeadoAte: "2026-06-30",
      }),
    ).toBe("Mergeadas por período");
  });
});

describe("mergeadasPivotSubtitle", () => {
  it("usa últimos 6 meses sem período global", () => {
    expect(mergeadasPivotSubtitle(DEFAULT_FILTERS, "epico")).toBe(
      "Contagem por épico e mês do merge (últimos 6 meses)",
    );
  });

  it("inclui tipo e intervalo do filtro global", () => {
    expect(
      mergeadasPivotSubtitle(
        {
          ...DEFAULT_FILTERS,
          periodoTipo: "merge",
          periodoDe: "2026-02-01",
          periodoAte: "2026-07-28",
          mergeadoDe: "2026-02-01",
          mergeadoAte: "2026-07-28",
        },
        "epico",
      ),
    ).toBe(
      "Contagem por épico e mês do merge (Filtro aplicado: Data de merge · 01/02/2026 – 28/07/2026)",
    );
  });

  it("reflete a dimensão ativa e data de fechamento", () => {
    expect(
      mergeadasPivotSubtitle(
        {
          ...DEFAULT_FILTERS,
          periodoTipo: "fechamento",
          periodoDe: "2026-01-01",
          periodoAte: "2026-03-31",
        },
        "modulo",
      ),
    ).toBe(
      "Contagem por módulo e mês do merge (Filtro aplicado: Data de fechamento · 01/01/2026 – 31/03/2026)",
    );
  });
});
