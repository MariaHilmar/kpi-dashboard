import { describe, expect, it } from "vitest";

import { NAO_INFORMADO } from "@/lib/dashboard/constants";
import {
  DEFAULT_MILESTONE_DELIVERY_LIMIT,
  DEFAULT_MILESTONE_DELIVERY_ORDER,
  milestoneDeliveryMaxVolume,
  milestoneDeliveryToComparisonBars,
  parseMilestoneDeliveryDimension,
  parseMilestoneDeliveryLimit,
  sortMilestoneDeliveryRows,
  type MilestoneDeliveryRow,
} from "@/lib/dashboard/milestone-delivery";

const ROWS: MilestoneDeliveryRow[] = [
  { label: "Alpha", entregues: 8, pontos_entregues: 13, wip_restante: 2, wip_pontos: 3 },
  { label: "Beta", entregues: 12, pontos_entregues: 5, wip_restante: 1, wip_pontos: 1 },
  { label: "Gamma", entregues: 3, pontos_entregues: 0, wip_restante: 4, wip_pontos: 0 },
];

describe("parseMilestoneDeliveryDimension", () => {
  it("aceita dimensões válidas", () => {
    expect(parseMilestoneDeliveryDimension("modulo")).toBe("modulo");
    expect(parseMilestoneDeliveryDimension("assignee")).toBe("assignee");
  });

  it("fallback para equipe", () => {
    expect(parseMilestoneDeliveryDimension("invalid")).toBe("equipe");
    expect(parseMilestoneDeliveryDimension(null)).toBe("equipe");
  });
});

describe("parseMilestoneDeliveryLimit", () => {
  it("usa default 10", () => {
    expect(parseMilestoneDeliveryLimit(null)).toBe(DEFAULT_MILESTONE_DELIVERY_LIMIT);
  });

  it("limita a 50", () => {
    expect(parseMilestoneDeliveryLimit("100")).toBe(50);
    expect(parseMilestoneDeliveryLimit("14")).toBe(14);
  });
});

describe("sortMilestoneDeliveryRows", () => {
  it("ordena por entregues desc por padrão de coluna", () => {
    const sorted = sortMilestoneDeliveryRows(ROWS, "entregues_desc");
    expect(sorted.map((row) => row.label)).toEqual(["Beta", "Alpha", "Gamma"]);
  });

  it("ordena por wip asc", () => {
    const sorted = sortMilestoneDeliveryRows(ROWS, "wip_asc");
    expect(sorted[0]?.label).toBe("Beta");
    expect(sorted.at(-1)?.label).toBe("Gamma");
  });

  it("ordena por entregues desc", () => {
    expect(sortMilestoneDeliveryRows(ROWS, DEFAULT_MILESTONE_DELIVERY_ORDER).map((r) => r.label)).toEqual([
      "Beta",
      "Alpha",
      "Gamma",
    ]);
  });
});

describe("milestoneDeliveryToComparisonBars", () => {
  it("mapeia entregues e wip", () => {
    expect(milestoneDeliveryToComparisonBars(ROWS)).toEqual([
      { label: "Alpha", entregues: 8, wip: 2 },
      { label: "Beta", entregues: 12, wip: 1 },
      { label: "Gamma", entregues: 3, wip: 4 },
    ]);
  });

  it("substitui label vazio", () => {
    expect(
      milestoneDeliveryToComparisonBars([
        { label: "", entregues: 1, pontos_entregues: 0, wip_restante: 0, wip_pontos: 0 },
      ]),
    ).toEqual([{ label: NAO_INFORMADO, entregues: 1, wip: 0 }]);
  });
});

describe("milestoneDeliveryMaxVolume", () => {
  it("retorna maior valor entre entregues e wip", () => {
    expect(milestoneDeliveryMaxVolume(ROWS)).toBe(12);
  });
});
