import { describe, expect, it } from "vitest";

import {
  buildMilestoneFluxoHref,
  fetchMilestoneBurndown,
  fetchMilestoneCapacityByTeam,
  fetchMilestoneDeliveryByDimension,
  fetchMilestoneLeadTimeDetail,
  fetchMilestoneRoadmap,
  fetchMilestoneStageDwell,
} from "@/lib/dashboard/milestone-report";

describe("buildMilestoneFluxoHref", () => {
  it("monta URL do fluxo com datas e granularidade", () => {
    expect(buildMilestoneFluxoHref("2026-01-06", "2026-01-17", "week")).toBe(
      "/fluxo?start_date=2026-01-06&end_date=2026-01-17&granularity=week",
    );
  });

  it("usa week como granularidade padrão", () => {
    expect(buildMilestoneFluxoHref("2026-01-06", "2026-01-17")).toBe(
      "/fluxo?start_date=2026-01-06&end_date=2026-01-17&granularity=week",
    );
  });
});

describe("fetchMilestoneStageDwell", () => {
  it("exporta função de fetch para report_milestone_stage_dwell", () => {
    expect(typeof fetchMilestoneStageDwell).toBe("function");
  });
});

describe("fetchMilestoneLeadTimeDetail", () => {
  it("exporta função de fetch para report_milestone_lead_time_detail", () => {
    expect(typeof fetchMilestoneLeadTimeDetail).toBe("function");
  });
});

describe("fetchMilestoneCapacityByTeam", () => {
  it("exporta função de fetch para report_milestone_capacity_by_team", () => {
    expect(typeof fetchMilestoneCapacityByTeam).toBe("function");
  });
});

describe("fetchMilestoneBurndown", () => {
  it("exporta função de fetch para report_milestone_burndown", () => {
    expect(typeof fetchMilestoneBurndown).toBe("function");
  });
});

describe("fetchMilestoneRoadmap", () => {
  it("exporta função de fetch para report_milestone_roadmap", () => {
    expect(typeof fetchMilestoneRoadmap).toBe("function");
  });
});

describe("fetchMilestoneDeliveryByDimension", () => {
  it("exporta função de fetch para report_milestone_delivery_by_dimension", () => {
    expect(typeof fetchMilestoneDeliveryByDimension).toBe("function");
  });
});

describe("fetchMilestoneCommitment", () => {
  it("exporta função de fetch para report_milestone_commitment", async () => {
    const { fetchMilestoneCommitment } = await import("@/lib/dashboard/milestone-report");
    expect(typeof fetchMilestoneCommitment).toBe("function");
  });
});

describe("fetchMilestoneIssues", () => {
  it("exporta função de fetch para report_milestone_issues", async () => {
    const { fetchMilestoneIssues } = await import("@/lib/dashboard/milestone-report");
    expect(typeof fetchMilestoneIssues).toBe("function");
  });
});
