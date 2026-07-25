import { describe, expect, it } from "vitest";

import {
  HIDDEN_DASHBOARD_PAGE_HREFS,
  isHiddenDashboardPageHref,
} from "@/lib/dashboard/page-visibility";

describe("page-visibility", () => {
  it("marca fluxo, milestone, roadmap, equipes e sprint como ocultas", () => {
    expect(HIDDEN_DASHBOARD_PAGE_HREFS.has("/fluxo")).toBe(true);
    expect(HIDDEN_DASHBOARD_PAGE_HREFS.has("/milestone")).toBe(true);
    expect(HIDDEN_DASHBOARD_PAGE_HREFS.has("/milestone/roadmap")).toBe(true);
    expect(HIDDEN_DASHBOARD_PAGE_HREFS.has("/equipes")).toBe(true);
    expect(HIDDEN_DASHBOARD_PAGE_HREFS.has("/sprint")).toBe(true);
  });

  it("não oculta outras rotas", () => {
    expect(isHiddenDashboardPageHref("/")).toBe(false);
  });
});
