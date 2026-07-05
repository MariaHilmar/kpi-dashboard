import { describe, expect, it } from "vitest";

import {
  milestoneRoadmapBarIntensity,
  milestoneRoadmapHasStoryPoints,
  milestoneRoadmapToLineSeries,
  milestoneRoadmapToTimeline,
  milestoneRoadmapUniqueLabels,
  parseMilestoneRoadmapGroupBy,
  parseMilestoneRoadmapMetric,
  parseMilestoneRoadmapTopN,
  resolveMilestoneRoadmapRange,
} from "@/lib/dashboard/milestone-roadmap";
import type { MilestoneOption } from "@/lib/dashboard/milestone-options";

const milestones: MilestoneOption[] = [
  { id: "1", gitlab_milestone_iid: 37, titulo: "Sprint 37" },
  { id: "2", gitlab_milestone_iid: 85, titulo: "Sprint 85" },
  { id: "3", gitlab_milestone_iid: 90, titulo: "Sprint 90" },
];

const sampleRows = [
  {
    milestone_iid: 88,
    milestone_titulo: "Sprint 88",
    milestone_start_date: "2025-10-01",
    milestone_due_date: "2025-10-14",
    label: "PNCP",
    rank_in_sprint: 1,
    entregues: 5,
    pontos_entregues: 21,
  },
  {
    milestone_iid: 88,
    milestone_titulo: "Sprint 88",
    milestone_start_date: "2025-10-01",
    milestone_due_date: "2025-10-14",
    label: "Contratos",
    rank_in_sprint: 2,
    entregues: 3,
    pontos_entregues: 13,
  },
  {
    milestone_iid: 90,
    milestone_titulo: "Sprint 90",
    milestone_start_date: "2025-11-01",
    milestone_due_date: "2025-11-14",
    label: "PNCP",
    rank_in_sprint: 1,
    entregues: 4,
    pontos_entregues: 18,
  },
];

describe("parseMilestoneRoadmapGroupBy", () => {
  it("usa modulo como padrão", () => {
    expect(parseMilestoneRoadmapGroupBy(null)).toBe("modulo");
    expect(parseMilestoneRoadmapGroupBy("equipe")).toBe("modulo");
  });

  it("aceita epico", () => {
    expect(parseMilestoneRoadmapGroupBy("epico")).toBe("epico");
  });
});

describe("parseMilestoneRoadmapMetric", () => {
  it("usa pontos como padrão", () => {
    expect(parseMilestoneRoadmapMetric(null)).toBe("pontos");
  });

  it("aceita issues", () => {
    expect(parseMilestoneRoadmapMetric("issues")).toBe("issues");
  });
});

describe("parseMilestoneRoadmapTopN", () => {
  it("usa 5 como padrão", () => {
    expect(parseMilestoneRoadmapTopN(null)).toBe(5);
  });

  it("limita a 20", () => {
    expect(parseMilestoneRoadmapTopN("50")).toBe(20);
  });
});

describe("resolveMilestoneRoadmapRange", () => {
  it("usa sprint 37 como início padrão quando disponível", () => {
    expect(resolveMilestoneRoadmapRange(milestones, null, null)).toEqual({
      fromIid: 37,
      toIid: 90,
    });
  });

  it("normaliza from/to invertidos", () => {
    expect(resolveMilestoneRoadmapRange(milestones, "90", "37")).toEqual({
      fromIid: 37,
      toIid: 90,
    });
  });

  it("retorna null sem milestones", () => {
    expect(resolveMilestoneRoadmapRange([], null, null)).toBeNull();
  });
});

describe("milestoneRoadmapToTimeline", () => {
  it("monta colunas por sprint com top items", () => {
    const timeline = milestoneRoadmapToTimeline(sampleRows, "pontos");

    expect(timeline.sprints.map((s) => s.milestone_iid)).toEqual([88, 90]);
    expect(timeline.maxCellValue).toBe(21);

    const sprint88 = timeline.sprints[0]?.cell;
    expect(sprint88?.items).toHaveLength(2);
    expect(sprint88?.items[0]?.label).toBe("PNCP");
    expect(sprint88?.totalEntregues).toBe(8);
  });
});

describe("milestoneRoadmapToLineSeries", () => {
  it("filtra série por módulo", () => {
    const series = milestoneRoadmapToLineSeries(sampleRows, "PNCP", "issues");
    expect(series).toHaveLength(2);
    expect(series[0]?.value).toBe(5);
    expect(series[1]?.value).toBe(4);
  });
});

describe("milestoneRoadmapUniqueLabels", () => {
  it("ordena labels por volume total", () => {
    expect(milestoneRoadmapUniqueLabels(sampleRows)).toEqual(["PNCP", "Contratos"]);
  });
});

describe("milestoneRoadmapHasStoryPoints", () => {
  it("detecta pontos no intervalo", () => {
    expect(milestoneRoadmapHasStoryPoints(sampleRows)).toBe(true);
  });
});

describe("milestoneRoadmapBarIntensity", () => {
  it("escala 0–1", () => {
    expect(milestoneRoadmapBarIntensity(0, 10)).toBe(0);
    expect(milestoneRoadmapBarIntensity(5, 10)).toBe(0.5);
  });
});
