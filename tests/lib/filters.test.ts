import { describe, expect, it } from "vitest";

import {
  DEFAULT_FILTERS,
  commonArgs,
  dateArgs,
  filtersToSearchParams,
  parseFilters,
  sortFilterOptions,
  sortSprintOptions,
} from "@/lib/dashboard/filters";

describe("parseFilters", () => {
  it("retorna defaults quando searchParams vazio", () => {
    expect(parseFilters({})).toEqual(DEFAULT_FILTERS);
  });

  it("parseia filtros de texto e ano", () => {
    const filters = parseFilters({
      modulo: "PNCP",
      area: "PNCP",
      tipo: "Bug",
      ano: "2024",
      criadoDe: "2024-01-01",
      fechadoAte: "2024-12-31",
    });

    expect(filters.modulo).toBe("PNCP");
    expect(filters.ano).toBe(2024);
    expect(filters.criadoDe).toBe("2024-01-01");
    expect(filters.fechadoAte).toBe("2024-12-31");
  });

  it("ignora ano invalido", () => {
    expect(parseFilters({ ano: "abc" }).ano).toBeNull();
    expect(parseFilters({ ano: "Todos" }).ano).toBeNull();
  });

  it("usa fallback para string vazia ou array", () => {
    expect(parseFilters({ modulo: "" }).modulo).toBe("Todos");
    expect(parseFilters({ modulo: ["PNCP"] }).modulo).toBe("Todos");
  });
});

describe("commonArgs e dateArgs", () => {
  it("mapeia filtros para argumentos RPC", () => {
    const filters = {
      ...DEFAULT_FILTERS,
      modulo: "Fiscalização",
      ano: 2025,
      criadoDe: "2025-01-01",
    };

    expect(commonArgs(filters)).toMatchObject({
      p_modulo: "Fiscalização",
      p_ano: 2025,
    });
    expect(dateArgs(filters)).toEqual({
      p_criado_de: "2025-01-01",
      p_criado_ate: null,
      p_fechado_de: null,
      p_fechado_ate: null,
    });
  });
});

describe("filtersToSearchParams", () => {
  it("omite valores default e vazios", () => {
    const params = filtersToSearchParams({
      modulo: "PNCP",
      area: "Todos",
      ano: null,
      tipo: "",
    });

    expect(params.get("modulo")).toBe("PNCP");
    expect(params.has("area")).toBe(false);
    expect(params.has("ano")).toBe(false);
    expect(params.has("tipo")).toBe(false);
  });

  it("inclui ano numerico", () => {
    const params = filtersToSearchParams({ ano: 2024 });
    expect(params.get("ano")).toBe("2024");
  });
});

describe("sortFilterOptions", () => {
  it("ordena com Todos primeiro e Não informado em seguida", () => {
    const sorted = sortFilterOptions(["Todos", "Zebra", "Não informado", "Alpha"]);
    expect(sorted).toEqual(["Todos", "Não informado", "Alpha", "Zebra"]);
  });

  it("ordena alfabeticamente em pt-BR", () => {
    const sorted = sortFilterOptions(["Área", "Administração", "Beta"]);
    expect(sorted[0]).toBe("Todos");
    expect(sorted.slice(1)).toEqual(["Administração", "Área", "Beta"]);
  });
});

describe("sortSprintOptions", () => {
  it("ordena sprints por numero decrescente", () => {
    const sorted = sortSprintOptions([
      "Todos",
      "Sprint 3",
      "Sprint 12",
      "Não informado",
      "Sprint 1",
    ]);
    expect(sorted).toEqual(["Todos", "Não informado", "Sprint 12", "Sprint 3", "Sprint 1"]);
  });
});
