import { describe, expect, it } from "vitest";

import {
  buildSprintDatesMap,
  getRoadmapMetricLabel,
  roadmapLabelOptions,
} from "@/components/dashboard/milestone/roadmap/roadmap-utils";
import type { MilestoneRoadmapRow } from "@/lib/dashboard/milestone-roadmap";

const sampleRows: MilestoneRoadmapRow[] = [
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
    milestone_iid: 90,
    milestone_titulo: "Sprint 90",
    milestone_start_date: "2025-11-01",
    milestone_due_date: "2025-11-14",
    label: "Contratos",
    rank_in_sprint: 1,
    entregues: 3,
    pontos_entregues: 13,
  },
];

describe("roadmap-utils", () => {
  it("buildSprintDatesMap indexa datas por milestone_iid", () => {
    const map = buildSprintDatesMap(sampleRows);

    expect(map.get(88)).toEqual({
      start_date: "2025-10-01",
      due_date: "2025-10-14",
    });
    expect(map.get(90)?.start_date).toBe("2025-11-01");
  });

  it("roadmapLabelOptions ordena labels alfabeticamente", () => {
    expect(roadmapLabelOptions(sampleRows)).toEqual(["Contratos", "PNCP"]);
  });

  it("getRoadmapMetricLabel descreve métrica", () => {
    expect(getRoadmapMetricLabel("issues")).toBe("Issues entregues");
    expect(getRoadmapMetricLabel("pontos")).toBe("Story points entregues");
  });
});
