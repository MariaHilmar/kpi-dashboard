import { describe, expect, it } from "vitest";

import {
  resolveMilestoneIidForSprintFilter,
  resolveLatestMilestoneIid,
  type MilestoneOption,
} from "@/lib/dashboard/milestone-options";

const milestones: MilestoneOption[] = [
  { id: "1", gitlab_milestone_iid: 89, titulo: "Sprint 89 - Contratos" },
  { id: "2", gitlab_milestone_iid: 90, titulo: "Sprint 90 - Contratos" },
];

describe("resolveMilestoneIidForSprintFilter", () => {
  it("mapeia rótulo exato do filtro sprint", () => {
    expect(resolveMilestoneIidForSprintFilter("Sprint 90 - Contratos", milestones)).toBe(90);
  });

  it("extrai IID numérico do rótulo", () => {
    expect(resolveMilestoneIidForSprintFilter("Sprint 89 - Contratos", milestones)).toBe(89);
  });

  it("retorna null quando sprint não corresponde a milestone importada", () => {
    expect(resolveMilestoneIidForSprintFilter("Sprint 99 - Foo", milestones)).toBeNull();
  });
});

describe("resolveLatestMilestoneIid", () => {
  it("retorna maior IID", () => {
    expect(resolveLatestMilestoneIid(milestones)).toBe(90);
  });
});
