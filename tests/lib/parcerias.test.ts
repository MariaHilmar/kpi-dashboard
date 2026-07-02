import { describe, expect, it } from "vitest";

import { TODOS } from "@/lib/dashboard/constants";
import {
  buildParceriasFilters,
  buildParceriasSelectOptions,
  defaultPreviousMonthRange,
  formatParceriaLabel,
  parseParceriasParams,
  parceriasExigeParceria,
  parceriasExportSlug,
  resolveParceiroSelection,
} from "@/lib/dashboard/parcerias-config";

const SAMPLE_PARCERIAS = [
  TODOS,
  "Não informado",
  "BCB",
  "DTI",
  "FNDE",
  "MGI",
  "PMSP",
  "SEBRAE",
  "TSE",
];

describe("defaultPreviousMonthRange", () => {
  it("retorna o mês calendário anterior", () => {
    const range = defaultPreviousMonthRange(new Date("2026-07-15T12:00:00"));
    expect(range).toEqual({ fechadoDe: "2026-06-01", fechadoAte: "2026-06-30" });
  });
});

describe("buildParceriasSelectOptions", () => {
  it("lista Todas e cada parceria existente no Supabase", () => {
    expect(buildParceriasSelectOptions(SAMPLE_PARCERIAS)).toEqual([
      TODOS,
      "Não informado",
      "BCB",
      "DTI",
      "FNDE",
      "MGI",
      "PMSP",
      "SEBRAE",
      "TSE",
    ]);
  });
});

describe("resolveParceiroSelection", () => {
  it("usa Todas por padrão", () => {
    expect(resolveParceiroSelection(undefined, SAMPLE_PARCERIAS)).toBe(TODOS);
  });

  it("aceita parceria válida do catálogo", () => {
    expect(resolveParceiroSelection("SEBRAE", SAMPLE_PARCERIAS)).toBe("SEBRAE");
  });

  it("rejeita parceria inexistente", () => {
    expect(resolveParceiroSelection("QINTESS", SAMPLE_PARCERIAS)).toBe(TODOS);
  });
});

describe("buildParceriasFilters", () => {
  it("aplica parceria específica", () => {
    const params = parseParceriasParams(
      { parceiro: "TSE", fechadoDe: "2026-06-01", fechadoAte: "2026-06-30" },
      SAMPLE_PARCERIAS,
    );
    const filters = buildParceriasFilters(params);

    expect(filters.parceria).toBe("TSE");
    expect(filters.fechadoDe).toBe("2026-06-01");
    expect(filters.fechadoAte).toBe("2026-06-30");
    expect(filters.criadoDe).toBeNull();
    expect(filters.criadoAte).toBeNull();
    expect(parceriasExigeParceria(params)).toBe(false);
  });

  it("aplica intervalo de criação quando informado", () => {
    const params = parseParceriasParams(
      {
        criadoDe: "2026-01-01",
        criadoAte: "2026-01-31",
      },
      SAMPLE_PARCERIAS,
    );
    const filters = buildParceriasFilters(params);

    expect(filters.criadoDe).toBe("2026-01-01");
    expect(filters.criadoAte).toBe("2026-01-31");
  });

  it("mantém Todas e exige parceria preenchida", () => {
    const params = parseParceriasParams({}, SAMPLE_PARCERIAS);
    expect(params.parceiro).toBe(TODOS);
    expect(parceriasExigeParceria(params)).toBe(true);
    expect(formatParceriaLabel(params.parceiro)).toBe("Todas as parcerias");
    expect(parceriasExportSlug(params.parceiro)).toBe("todas");
  });
});

describe("parseParceriasParams", () => {
  it("usa mês anterior quando datas não informadas", () => {
    const params = parseParceriasParams({}, SAMPLE_PARCERIAS);
    expect(params.fechadoDe).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(params.fechadoAte).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("resolve order da query string", () => {
    const params = parseParceriasParams(
      { parceiro: "SEBRAE", order: "titulo_asc" },
      SAMPLE_PARCERIAS,
    );
    expect(params.order).toBe("titulo_asc");
  });

  it("rejeita order inválido", () => {
    const params = parseParceriasParams(
      { parceiro: "SEBRAE", order: "coluna_invalida" },
      SAMPLE_PARCERIAS,
    );
    expect(params.order).toBe("fechado_em_desc");
  });
});
