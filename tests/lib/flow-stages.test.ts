import { describe, expect, it } from "vitest";

import {
  FLOW_CFD_ETAPAS,
  FLOW_WIP_ETAPAS,
  getFlowCfdFillOpacity,
  isExcludedEtapa,
  isWipEtapa,
  mapStatusToFlowEtapa,
  orderCfdEtapasForDisplay,
  orderCfdEtapasForStack,
  resolveEtapaOnDate,
} from "@/lib/dashboard/flow-stages";

describe("mapStatusToFlowEtapa", () => {
  it("mapeia status conhecidos do GitLab", () => {
    expect(mapStatusToFlowEtapa("Backlog", "Aberto")).toBe("Backlog");
    expect(mapStatusToFlowEtapa("Doing", "Aberto")).toBe("Em Desenvolvimento");
    expect(mapStatusToFlowEtapa("Sprint Atual", "Aberto")).toBe("A Fazer");
    expect(mapStatusToFlowEtapa("Em Revisão", "Aberto")).toBe("Em Teste");
    expect(mapStatusToFlowEtapa("Delivered", "Aberto")).toBe("Concluído");
    expect(mapStatusToFlowEtapa(null, "Fechado")).toBe("Concluído");
  });

  it("exclui cancelados", () => {
    expect(mapStatusToFlowEtapa("Cancelado", "Aberto")).toBe("Cancelado");
    expect(isExcludedEtapa("Cancelado")).toBe(true);
  });
});

describe("getFlowCfdFillOpacity", () => {
  it("destaca etapas WIP e suaviza terminais", () => {
    for (const etapa of FLOW_WIP_ETAPAS) {
      expect(getFlowCfdFillOpacity(etapa)).toBe(0.75);
    }
    expect(getFlowCfdFillOpacity("Backlog")).toBe(0.3);
    expect(getFlowCfdFillOpacity("Concluído")).toBe(0.3);
    expect(getFlowCfdFillOpacity("Cancelado")).toBe(0.3);
  });
});

describe("WIP etapas", () => {
  it("inclui apenas etapas ativas", () => {
    for (const etapa of FLOW_WIP_ETAPAS) {
      expect(isWipEtapa(etapa)).toBe(true);
    }
    expect(isWipEtapa("Backlog")).toBe(false);
    expect(isWipEtapa("Concluído")).toBe(false);
  });

  it("mantém ordem do CFD", () => {
    expect(FLOW_CFD_ETAPAS.indexOf("A Fazer")).toBeLessThan(
      FLOW_CFD_ETAPAS.indexOf("Em Desenvolvimento"),
    );
  });

  it("ordena legenda/tooltip de cima para baixo", () => {
    const subset = ["Backlog", "Concluído", "Em Teste"];
    expect(orderCfdEtapasForStack(subset)).toEqual(["Backlog", "Em Teste", "Concluído"]);
    expect(orderCfdEtapasForDisplay(subset)).toEqual(["Concluído", "Em Teste", "Backlog"]);
  });
});

describe("resolveEtapaOnDate (aproximação CFD)", () => {
  const criado = new Date("2026-06-01");
  const fechado = new Date("2026-06-10");

  it("retorna null antes da criação", () => {
    expect(
      resolveEtapaOnDate({
        status: "Doing",
        estado: "Aberto",
        criadoEm: criado,
        fechadoEm: null,
        ref: new Date("2026-05-31"),
      }),
    ).toBeNull();
  });

  it("usa status atual entre criado e fechado", () => {
    expect(
      resolveEtapaOnDate({
        status: "Doing",
        estado: "Aberto",
        criadoEm: criado,
        fechadoEm: fechado,
        ref: new Date("2026-06-05"),
      }),
    ).toBe("Em Desenvolvimento");
  });

  it("marca Concluído a partir de fechado_em", () => {
    expect(
      resolveEtapaOnDate({
        status: "Doing",
        estado: "Fechado",
        criadoEm: criado,
        fechadoEm: fechado,
        ref: new Date("2026-06-10"),
      }),
    ).toBe("Concluído");
  });
});
