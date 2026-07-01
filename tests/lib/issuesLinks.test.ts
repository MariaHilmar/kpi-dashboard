import { describe, expect, it } from "vitest";

import { DEFAULT_FILTERS } from "@/lib/dashboard/filters";
import { NAO_INFORMADO } from "@/lib/dashboard/constants";
import {
  buildAlertasPorModuloIssuesHref,
  buildAlertasResumoIssuesHref,
  buildFaixaIdadeIssuesHref,
  buildIssuesHref,
} from "@/lib/dashboard/issuesLinks";

describe("issuesLinks", () => {
  const filters = {
    ...DEFAULT_FILTERS,
    modulo: "Fiscalização",
    equipe: "Alpha",
  };

  it("buildIssuesHref preserva filtros globais e remove page", () => {
    const href = buildIssuesHref(filters, { estado: "open" });
    const params = new URL(href, "http://localhost").searchParams;
    expect(params.get("modulo")).toBe("Fiscalização");
    expect(params.get("equipe")).toBe("Alpha");
    expect(params.get("estado")).toBe("open");
    expect(params.get("page")).toBeNull();
  });

  it("buildAlertasPorModuloIssuesHref filtra sem épico por módulo", () => {
    const href = buildAlertasPorModuloIssuesHref(filters, "sem_epico", "Fiscalização");
    const params = new URL(href, "http://localhost").searchParams;
    expect(params.get("estado")).toBe("open");
    expect(params.get("epico")).toBe(NAO_INFORMADO);
    expect(params.get("modulo")).toBe("Fiscalização");
  });

  it("buildAlertasPorModuloIssuesHref filtra sem parceria", () => {
    const href = buildAlertasPorModuloIssuesHref(filters, "sem_parceria", "PNCP");
    const params = new URL(href, "http://localhost").searchParams;
    expect(params.get("parceria")).toBe(NAO_INFORMADO);
    expect(params.get("modulo")).toBe("PNCP");
  });

  it("buildFaixaIdadeIssuesHref inclui faixaIdade", () => {
    const href = buildFaixaIdadeIssuesHref(filters, "0-30 dias");
    const params = new URL(href, "http://localhost").searchParams;
    expect(params.get("estado")).toBe("open");
    expect(params.get("faixaIdade")).toBe("0-30 dias");
    expect(params.get("modulo")).toBe("Fiscalização");
  });

  it("buildAlertasResumoIssuesHref sem épico", () => {
    const href = buildAlertasResumoIssuesHref(filters, "sem_epico");
    expect(new URL(href, "http://localhost").searchParams.get("epico")).toBe(NAO_INFORMADO);
  });
});
