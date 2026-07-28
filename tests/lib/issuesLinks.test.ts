import { describe, expect, it } from "vitest";

import { DEFAULT_FILTERS } from "@/lib/dashboard/filters";
import { NAO_INFORMADO } from "@/lib/dashboard/constants";
import {
  anoMesToCriadoRange,
  buildAggregateIssuesHref,
  buildAnalistaDistribuicaoIssuesHref,
  buildAnalistaIssuesHref,
  buildAlertasPorModuloIssuesHref,
  buildAlertasResumoIssuesHref,
  buildFaixaIdadeIssuesHref,
  buildIssuesHref,
  buildKpiIssuesHref,
  buildFlowPeriodIssuesHref,
  buildMergeadasPivotIssuesHref,
  buildMilestoneDeliveryIssuesHref,
  buildMilestoneRoadmapIssuesHref,
  mergeadasSixMonthWindow,
  periodKeyToMergeRange,
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

  it("buildAggregateIssuesHref usa busca livre para desenvolvedor", () => {
    const href = buildAggregateIssuesHref(filters, "desenvolvedor", "João Git");
    expect(href).not.toBeNull();
    expect(new URL(href!, "http://localhost").searchParams.get("q")).toBe("João Git");
  });

  it("periodKeyToMergeRange converte YYYY/MM em intervalo de merge", () => {
    expect(periodKeyToMergeRange("2026/03")).toEqual({
      mergeadoDe: "2026-03-01",
      mergeadoAte: "2026-03-31",
    });
  });

  it("buildMergeadasPivotIssuesHref inclui mergeadoDe/Ate e módulo", () => {
    const href = buildMergeadasPivotIssuesHref(filters, {
      linha: "PNCP",
      periodo: "2026/02",
      dimensao: "modulo",
    });
    expect(href).not.toBeNull();
    const params = new URL(href!, "http://localhost").searchParams;
    expect(params.get("modulo")).toBe("PNCP");
    expect(params.get("mergeadoDe")).toBe("2026-02-01");
    expect(params.get("mergeadoAte")).toBe("2026-02-28");
    expect(params.get("sprint")).toBeNull();
  });

  it("buildMergeadasPivotIssuesHref filtra por parceria quando a dimensão é parceria", () => {
    const href = buildMergeadasPivotIssuesHref(filters, {
      linha: "SEBRAE",
      periodo: "2026/02",
      dimensao: "parceria",
    });
    expect(href).not.toBeNull();
    const params = new URL(href!, "http://localhost").searchParams;
    expect(params.get("parceria")).toBe("SEBRAE");
    expect(params.get("mergeadoDe")).toBe("2026-02-01");
  });

  const analistaCtx = {
    anoMes: "2026/07",
    sprint: "Todos",
    modulo: "Todos",
    autor: "Maria",
  };

  it("anoMesToCriadoRange cobre o mês de criação inteiro", () => {
    expect(anoMesToCriadoRange("2026/02")).toEqual({
      criadoDe: "2026-02-01",
      criadoAte: "2026-02-28",
    });
  });

  it("buildAnalistaIssuesHref reproduz o recorte por criação e autor", () => {
    const href = buildAnalistaIssuesHref(analistaCtx, { estado: "open" });
    expect(href).not.toBeNull();
    const params = new URL(href!, "http://localhost").searchParams;
    expect(params.get("periodo")).toBe("todos");
    expect(params.get("criadoDe")).toBe("2026-07-01");
    expect(params.get("criadoAte")).toBe("2026-07-31");
    expect(params.get("autor")).toBe("Maria");
    expect(params.get("estado")).toBe("open");
    // Sprint/módulo "Todos" não viram filtro.
    expect(params.get("sprint")).toBeNull();
    expect(params.get("modulo")).toBeNull();
  });

  it("buildAnalistaIssuesHref usa autorId (gitlab) e omite o nome quando há id", () => {
    const href = buildAnalistaIssuesHref(
      { ...analistaCtx, gitlabAuthorId: 30737159 },
      { parceria: "BCB" },
    );
    expect(href).not.toBeNull();
    const params = new URL(href!, "http://localhost").searchParams;
    expect(params.get("autorId")).toBe("30737159");
    expect(params.get("autor")).toBeNull();
    expect(params.get("parceria")).toBe("BCB");
  });

  it("buildAnalistaDistribuicaoIssuesHref mapeia 'Sem Parceiro' para 'Não informado'", () => {
    const href = buildAnalistaDistribuicaoIssuesHref(analistaCtx, "parceria", {
      label: "Sem Parceiro",
      estado: "closed",
    });
    expect(href).not.toBeNull();
    const params = new URL(href!, "http://localhost").searchParams;
    expect(params.get("parceria")).toBe(NAO_INFORMADO);
    expect(params.get("estado")).toBe("closed");
    expect(params.get("criadoDe")).toBe("2026-07-01");
  });

  it("mergeadasSixMonthWindow cobre 6 meses incluindo o atual", () => {
    const window = mergeadasSixMonthWindow(new Date(2026, 6, 15));
    expect(window.mergeadoDe).toBe("2026-02-01");
    expect(window.mergeadoAte).toBe("2026-07-31");
  });
});
