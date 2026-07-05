import { describe, expect, it } from "vitest";

import { DEFAULT_FILTERS } from "@/lib/dashboard/filters";
import { NAO_INFORMADO } from "@/lib/dashboard/constants";
import {
  buildAggregateIssuesHref,
  buildAlertasPorModuloIssuesHref,
  buildAlertasResumoIssuesHref,
  buildFaixaIdadeIssuesHref,
  buildIssuesHref,
  buildKpiIssuesHref,
  buildFlowPeriodIssuesHref,
  buildMilestoneDeliveryIssuesHref,
  buildMilestoneRoadmapIssuesHref,
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

  it("buildKpiIssuesHref bugs abertos filtra tipo e estado", () => {
    const href = buildKpiIssuesHref(filters, "bugs_abertos");
    const params = new URL(href, "http://localhost").searchParams;
    expect(params.get("estado")).toBe("open");
    expect(params.get("tipo")).toBe("Bug");
  });

  it("buildKpiIssuesHref sem tipo usa Não informado", () => {
    const href = buildKpiIssuesHref(filters, "sem_tipo");
    expect(new URL(href, "http://localhost").searchParams.get("tipo")).toBe(NAO_INFORMADO);
  });

  it("buildAggregateIssuesHref mapeia dimensão para filtro", () => {
    const href = buildAggregateIssuesHref(filters, "modulo", "PNCP", { estado: "open" });
    expect(href).not.toBeNull();
    const params = new URL(href!, "http://localhost").searchParams;
    expect(params.get("modulo")).toBe("PNCP");
    expect(params.get("estado")).toBe("open");
  });

  it("buildAggregateIssuesHref converte Em execução para filtro Doing", () => {
    const href = buildAggregateIssuesHref(filters, "status", "Em execução");
    expect(href).not.toBeNull();
    expect(new URL(href!, "http://localhost").searchParams.get("status")).toBe("Doing");
  });

  it("buildFlowPeriodIssuesHref inclui fechadoDe/fechadoAte", () => {
    const href = buildFlowPeriodIssuesHref(
      {
        ...DEFAULT_FILTERS,
        startDate: "2026-01-01",
        endDate: "2026-03-31",
        assignee: "Todos",
        projectId: null,
        milestone: null,
        module: null,
      },
      "closed",
    );
    expect(href).not.toBeNull();
    const params = new URL(href!, "http://localhost").searchParams;
    expect(params.get("estado")).toBe("closed");
    expect(params.get("fechadoDe")).toBe("2026-01-01");
    expect(params.get("fechadoAte")).toBe("2026-03-31");
  });

  it("buildMilestoneDeliveryIssuesHref filtra entregues por dimensão e sprint", () => {
    const href = buildMilestoneDeliveryIssuesHref(
      {
        titulo: "Sprint 90 - Contratos",
        start_date: "2026-01-06",
        due_date: "2026-01-17",
      },
      "modulo",
      "PNCP",
      "entregues",
    );
    expect(href).not.toBeNull();
    const params = new URL(href!, "http://localhost").searchParams;
    expect(params.get("estado")).toBe("closed");
    expect(params.get("modulo")).toBe("PNCP");
    expect(params.get("sprint")).toBe("Sprint 90 - Contratos");
    expect(params.get("fechadoDe")).toBe("2026-01-06");
    expect(params.get("fechadoAte")).toBe("2026-01-17");
  });

  it("buildMilestoneRoadmapIssuesHref filtra entregues por módulo e sprint", () => {
    const href = buildMilestoneRoadmapIssuesHref(
      {
        titulo: "Sprint 90 - Contratos",
        start_date: "2026-01-06",
        due_date: "2026-01-17",
      },
      "modulo",
      "PNCP",
    );
    expect(href).not.toBeNull();
    const params = new URL(href!, "http://localhost").searchParams;
    expect(params.get("estado")).toBe("closed");
    expect(params.get("modulo")).toBe("PNCP");
    expect(params.get("sprint")).toBe("Sprint 90 - Contratos");
    expect(params.get("fechadoDe")).toBe("2026-01-06");
    expect(params.get("fechadoAte")).toBe("2026-01-17");
  });

  it("buildMilestoneRoadmapIssuesHref filtra por épico", () => {
    const href = buildMilestoneRoadmapIssuesHref(
      { titulo: "Sprint 88", start_date: "2026-01-01", due_date: "2026-01-14" },
      "epico",
      "Épico Compras",
    );
    expect(href).not.toBeNull();
    expect(new URL(href!, "http://localhost").searchParams.get("epico")).toBe("Épico Compras");
  });

  it("buildMilestoneDeliveryIssuesHref usa busca livre para assignee", () => {
    const href = buildMilestoneDeliveryIssuesHref(
      { titulo: "Sprint 90", start_date: null, due_date: null },
      "assignee",
      "Maria Silva",
      "wip",
    );
    expect(href).not.toBeNull();
    const params = new URL(href!, "http://localhost").searchParams;
    expect(params.get("estado")).toBe("open");
    expect(params.get("q")).toBe("Maria Silva");
    expect(params.get("sprint")).toBe("Sprint 90");
  });
});
