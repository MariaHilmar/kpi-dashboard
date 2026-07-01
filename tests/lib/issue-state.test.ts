import { describe, expect, it } from "vitest";

import { isIssueOpen, issueEstadoLabel } from "@/lib/dashboard/issue-state";

describe("issue-state", () => {
  it("reconhece estado aberto em ingles e portugues", () => {
    expect(isIssueOpen("open")).toBe(true);
    expect(isIssueOpen("opened")).toBe(true);
    expect(isIssueOpen("Aberto")).toBe(true);
  });

  it("reconhece estado fechado", () => {
    expect(isIssueOpen("closed")).toBe(false);
    expect(isIssueOpen("Fechado")).toBe(false);
    expect(issueEstadoLabel("Fechado")).toBe("Fechada");
  });

  it("prioriza flag aberto quando informada", () => {
    expect(isIssueOpen("Fechado", true)).toBe(true);
    expect(isIssueOpen("Aberto", false)).toBe(false);
  });
});
