import { describe, expect, it } from "vitest";

import {
  buildMilestoneNotDeliveredHref,
  formatMilestoneCommitmentWindow,
  milestoneCommitmentDeliveryRate,
  milestoneCommitmentToComparisonBars,
} from "@/lib/dashboard/milestone-commitment";

describe("milestoneCommitmentDeliveryRate", () => {
  it("calcula taxa com uma casa decimal", () => {
    expect(milestoneCommitmentDeliveryRate(8, 10)).toBe(80);
    expect(milestoneCommitmentDeliveryRate(1, 3)).toBe(33.3);
  });

  it("retorna null quando comprometido = 0", () => {
    expect(milestoneCommitmentDeliveryRate(0, 0)).toBeNull();
  });
});

describe("milestoneCommitmentToComparisonBars", () => {
  it("inclui apenas issues quando story points ausentes", () => {
    const bars = milestoneCommitmentToComparisonBars({
      start_date: "2026-01-06",
      due_date: "2026-01-17",
      committed_issues: 10,
      committed_story_points: 0,
      delivered_issues: 7,
      delivered_story_points: 0,
      not_delivered_issues: 3,
      not_delivered_story_points: 0,
      has_story_points: false,
      missing_close_date_issues: 0,
    });

    expect(bars).toEqual([{ label: "Issues", comprometido: 10, entregue: 7 }]);
  });

  it("inclui story points quando has_story_points", () => {
    const bars = milestoneCommitmentToComparisonBars({
      start_date: null,
      due_date: null,
      committed_issues: 5,
      committed_story_points: 50,
      delivered_issues: 4,
      delivered_story_points: 40,
      not_delivered_issues: 1,
      not_delivered_story_points: 10,
      has_story_points: true,
      missing_close_date_issues: 0,
    });

    expect(bars).toHaveLength(2);
    expect(bars[1]).toEqual({
      label: "Story points",
      comprometido: 50,
      entregue: 40,
    });
  });
});

describe("buildMilestoneNotDeliveredHref", () => {
  it("monta URL com filtro not_delivered", () => {
    expect(buildMilestoneNotDeliveredHref(90)).toBe(
      "/milestone?iid=90&issues_metric=not_delivered",
    );
  });
});

describe("formatMilestoneCommitmentWindow", () => {
  it("formata intervalo da sprint", () => {
    expect(formatMilestoneCommitmentWindow("2026-01-06", "2026-01-17")).toBe(
      "2026-01-06 → 2026-01-17",
    );
  });
});
