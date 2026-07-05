import { describe, expect, it } from "vitest";

import { parseMilestoneIssuesListParams } from "@/lib/dashboard/milestone-issues-params";

describe("parseMilestoneIssuesListParams", () => {
  it("usa defaults quando params ausentes", () => {
    const result = parseMilestoneIssuesListParams(new URLSearchParams());

    expect(result).toEqual({
      search: "",
      status: "Todos",
      estado: "Todos",
      metric: "Todos",
      order: "gitlab_iid_asc",
      page: 1,
      pageSize: 50,
    });
  });

  it("parseia filtros e paginação", () => {
    const params = new URLSearchParams({
      issues_search: "PNCP",
      issues_status: "Em Desenvolvimento",
      issues_estado: "Aberto",
      issues_metric: "wip",
      issues_order: "story_points_desc",
      issues_page: "2",
      issues_page_size: "100",
    });

    expect(parseMilestoneIssuesListParams(params)).toEqual({
      search: "PNCP",
      status: "Em Desenvolvimento",
      estado: "Aberto",
      metric: "wip",
      order: "story_points_desc",
      page: 2,
      pageSize: 100,
    });
  });

  it("limita pageSize ao máximo", () => {
    const params = new URLSearchParams({ issues_page_size: "500" });
    expect(parseMilestoneIssuesListParams(params).pageSize).toBe(200);
  });
});
