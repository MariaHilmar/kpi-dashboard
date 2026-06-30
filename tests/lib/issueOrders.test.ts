import { describe, expect, it } from "vitest";

import {
  DEFAULT_ISSUE_ORDER,
  getIssueColumnSortDirection,
  toggleIssueColumnOrder,
} from "@/lib/dashboard/issueOrders";

describe("issueOrders", () => {
  it("alterna entre desc e asc", () => {
    expect(toggleIssueColumnOrder("criado_em_desc", "criado")).toBe("criado_em_asc");
    expect(toggleIssueColumnOrder("criado_em_asc", "criado")).toBe("criado_em_desc");
  });

  it("usa desc como primeira ordenação de coluna", () => {
    expect(toggleIssueColumnOrder(DEFAULT_ISSUE_ORDER, "titulo")).toBe("titulo_desc");
  });

  it("identifica direção ativa por coluna", () => {
    expect(getIssueColumnSortDirection("id_desc", "id")).toBe("desc");
    expect(getIssueColumnSortDirection("id_asc", "id")).toBe("asc");
    expect(getIssueColumnSortDirection("criado_em_desc", "id")).toBeNull();
  });
});
