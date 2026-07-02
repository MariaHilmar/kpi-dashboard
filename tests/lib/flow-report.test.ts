import { describe, expect, it } from "vitest";

import {
  buildFlowReportFiltersMeta,
  flowRpcArgs,
  flowRpcScopeArgs,
  parseFlowReportParams,
  shiftFlowPeriod,
} from "@/lib/dashboard/flow-report-params";
import { wrapFlowResponse } from "@/lib/dashboard/flow-report";
import { DEFAULT_FILTERS } from "@/lib/dashboard/filters";

describe("parseFlowReportParams", () => {
  it("mapeia parâmetros da API para filtros internos", () => {
    const params = new URLSearchParams({
      project_id: "Contratos v2",
      module: "API v2",
      milestone: "Sprint 42",
      assignee: "Maria",
      start_date: "2026-06-01",
      end_date: "2026-06-30",
    });

    const filters = parseFlowReportParams(params);

    expect(filters.repositorio).toBe("Contratos v2");
    expect(filters.projectId).toBe("Contratos v2");
    expect(filters.modulo).toBe("API v2");
    expect(filters.sprint).toBe("Sprint 42");
    expect(filters.assignee).toBe("Maria");
    expect(filters.startDate).toBe("2026-06-01");
    expect(filters.endDate).toBe("2026-06-30");
  });
});

describe("flowRpcArgs", () => {
  it("repassa datas apenas para RPCs com período", () => {
    const filters = parseFlowReportParams(
      new URLSearchParams({ start_date: "2026-01-01", assignee: "João" }),
    );

    expect(flowRpcArgs(filters)).toMatchObject({
      p_start_date: "2026-01-01",
      p_assignee: "João",
    });
    expect(flowRpcScopeArgs(filters)).toMatchObject({
      p_assignee: "João",
      p_modulo: DEFAULT_FILTERS.modulo,
    });
    expect(flowRpcScopeArgs(filters)).not.toHaveProperty("p_start_date");
  });
});

describe("shiftFlowPeriod", () => {
  it("desloca o recorte para o período anterior com mesma duração", () => {
    const filters = parseFlowReportParams(
      new URLSearchParams({
        start_date: "2026-06-01",
        end_date: "2026-06-30",
        modulo: "API v2",
      }),
    );

    expect(shiftFlowPeriod(filters)).toMatchObject({
      startDate: "2026-05-02",
      endDate: "2026-05-31",
      modulo: "API v2",
    });
  });

  it("preserva filtros de escopo exceto datas", () => {
    const filters = parseFlowReportParams(
      new URLSearchParams({
        start_date: "2026-06-01",
        end_date: "2026-06-30",
        assignee: "Maria",
        project_id: "Contratos v2",
      }),
    );

    expect(shiftFlowPeriod(filters)).toMatchObject({
      assignee: "Maria",
      repositorio: "Contratos v2",
      startDate: "2026-05-02",
      endDate: "2026-05-31",
    });
  });
});

describe("wrapFlowResponse", () => {
  it("inclui metadados de filtro e aproximações", () => {
    const filters = parseFlowReportParams(
      new URLSearchParams({ start_date: "2026-06-01", end_date: "2026-06-30" }),
    );

    const body = wrapFlowResponse(filters, [{ etapa: "Backlog", quantidade: 1 }]);

    expect(body.filters).toEqual(buildFlowReportFiltersMeta(filters));
    expect(body.data).toHaveLength(1);
    expect(body.approximations.cfd).toContain("issue_status_events");
    expect(body.approximations.leadTimeStart).toContain("Cycle time");
  });
});
