import { describe, expect, it } from "vitest";

import { buildMilestoneFluxoHref } from "@/lib/dashboard/milestone-report";

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
