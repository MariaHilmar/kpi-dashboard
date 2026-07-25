import { describe, expect, it } from "vitest";

import {
  DEFAULT_FILTERS,
  commonArgs,
  dateArgs,
  ensureFilterOption,
  filtersToSearchParams,
  parseFilters,
  resolveLatestSprint,
  rpcFilterArgsIgnoringSprintAndPeriod,
  sortFilterOptions,
  sortSprintOptions,
} from "@/lib/dashboard/filters";
import {
  formatPeriodContextLabel,
  formatPeriodSummaryShort,
  resolvePeriodDates,
} from "@/lib/dashboard/period-filter";

describe("parseFilters", () => {
  it("retorna defaults quando searchParams vazio", () => {
    expect(parseFilters({})).toEqual(DEFAULT_FILTERS);
  });

  it("parseia periodo por tipo criação", () => {
    const filters = parseFilters({
      periodoTipo: "criacao",
      periodoDe: "2024-01-01",
      periodoAte: "2024-12-31",
    });

    expect(filters.periodoTipo).toBe("criacao");
    expect(filters.criadoDe).toBe("2024-01-01");
    expect(filters.criadoAte).toBe("2024-12-31");
    expect(filters.mergeadoDe).toBeNull();
  });

  it("parseia periodo por merge", () => {
    const filters = parseFilters({
      periodoTipo: "merge",
      periodoDe: "2025-06-01",
      periodoAte: "2025-06-30",
    });

    expect(filters.mergeadoDe).toBe("2025-06-01");
    expect(filters.mergeadoAte).toBe("2025-06-30");
  });

  it("mapeia ano legado para intervalo de criação", () => {
    const filters = parseFilters({ ano: "2024" });
    expect(filters.criadoDe).toBe("2024-01-01");
    expect(filters.criadoAte).toBe("2024-12-31");
    expect(filters.ano).toBeNull();
  });

  it("usa fallback para string vazia ou array", () => {
    expect(parseFilters({ modulo: "" }).modulo).toBe("Todos");
    expect(parseFilters({ modulo: ["PNCP"] }).modulo).toBe("Todos");
  });
});

describe("resolvePeriodDates", () => {
  it("mapeia fechamento", () => {
    const resolved = resolvePeriodDates({
      periodoTipo: "fechamento",
      periodoDe: "2025-01-01",
      periodoAte: null,
      ano: null,
    });
    expect(resolved.fechadoDe).toBe("2025-01-01");
    expect(resolved.criadoDe).toBeNull();
  });
});

describe("commonArgs e dateArgs", () => {
  it("mapeia filtros para argumentos RPC", () => {
    const filters = parseFilters({
      modulo: "Fiscalização",
      periodoTipo: "criacao",
      periodoDe: "2025-01-01",
      periodoAte: "2025-12-31",
    });

    expect(commonArgs(filters)).toMatchObject({
      p_modulo: "Fiscalização",
      p_ano: null,
    });
    expect(dateArgs(filters)).toEqual({
      p_criado_de: "2025-01-01",
      p_criado_ate: "2025-12-31",
      p_fechado_de: null,
      p_fechado_ate: null,
      p_mergeado_de: null,
      p_mergeado_ate: null,
    });
  });
});

describe("filtersToSearchParams", () => {
  it("omite valores default e campos derivados", () => {
    const params = filtersToSearchParams({
      modulo: "PNCP",
      area: "Todos",
      periodoDe: null,
      periodoAte: null,
      periodoTipo: "fechamento",
    });

    expect(params.get("modulo")).toBe("PNCP");
    expect(params.has("area")).toBe(false);
    expect(params.has("periodoTipo")).toBe(false);
  });

  it("inclui periodo na URL", () => {
    const params = filtersToSearchParams({
      periodoTipo: "merge",
      periodoDe: "2025-01-01",
      periodoAte: "2025-01-31",
    });
    expect(params.get("periodoTipo")).toBe("merge");
    expect(params.get("periodoDe")).toBe("2025-01-01");
  });
  it("formata ano completo de forma compacta", () => {
    expect(
      formatPeriodSummaryShort(
        { periodoTipo: "criacao", periodoDe: "2025-01-01", periodoAte: "2025-12-31", ano: null },
        { criacao: "Criação", fechamento: "Fechamento", merge: "Merge" },
      ),
    ).toBe("Criação · 2025");
  });
});

describe("formatPeriodContextLabel", () => {
  it("retorna null quando não há período", () => {
    expect(
      formatPeriodContextLabel({
        periodoTipo: "criacao",
        periodoDe: null,
        periodoAte: null,
        ano: null,
      }),
    ).toBeNull();
  });

  it("formata intervalo por data de fechamento", () => {
    expect(
      formatPeriodContextLabel({
        periodoTipo: "fechamento",
        periodoDe: "2026-06-01",
        periodoAte: "2026-06-30",
        ano: null,
      }),
    ).toBe("Dados por data de fechamento de 01/06/2026 a 30/06/2026");
  });

  it("formata ano legado como criação", () => {
    expect(
      formatPeriodContextLabel({
        periodoTipo: "criacao",
        periodoDe: null,
        periodoAte: null,
        ano: 2024,
      }),
    ).toBe("Dados por data de criação de 01/01/2024 a 31/12/2024");
  });
});

describe("rpcFilterArgsIgnoringSprintAndPeriod", () => {
  it("ignora sprint e datas do período global", () => {
    const filters = parseFilters({
      modulo: "Fiscalização",
      sprint: "Sprint 90",
      periodoTipo: "fechamento",
      periodoDe: "2026-06-01",
      periodoAte: "2026-06-30",
    });

    expect(rpcFilterArgsIgnoringSprintAndPeriod(filters)).toMatchObject({
      p_modulo: "Fiscalização",
      p_sprint: "Todos",
      p_criado_de: null,
      p_fechado_de: null,
      p_mergeado_de: null,
      p_ano: null,
    });
  });
});

describe("sortFilterOptions", () => {
  it("ordena com Todos primeiro e Não informado em seguida", () => {
    const sorted = sortFilterOptions(["Todos", "Zebra", "Não informado", "Alpha"]);
    expect(sorted).toEqual(["Todos", "Não informado", "Alpha", "Zebra"]);
  });
});

describe("sortSprintOptions", () => {
  it("ordena sprints por numero decrescente", () => {
    const sorted = sortSprintOptions(["Todos", "Sprint 3", "Sprint 12", "Não informado"]);
    expect(sorted).toEqual(["Todos", "Não informado", "Sprint 12", "Sprint 3"]);
  });
});

describe("resolveLatestSprint", () => {
  it("retorna a sprint com maior numero", () => {
    expect(resolveLatestSprint(["Todos", "Sprint 88", "Sprint 90 - Contratos"])).toBe(
      "Sprint 90 - Contratos",
    );
  });
});

describe("ensureFilterOption", () => {
  it("inclui valor da URL ausente na lista de opcoes", () => {
    const options = ensureFilterOption(["Todos", "PNCP"], "Fiscalização");
    expect(options).toContain("Fiscalização");
  });
});
