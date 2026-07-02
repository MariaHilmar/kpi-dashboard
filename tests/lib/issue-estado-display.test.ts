import { describe, expect, it } from "vitest";

import {
  getIssueEstadoTone,
  resolveIssueEstadoLabel,
} from "@/lib/dashboard/issue-estado-display";

describe("resolveIssueEstadoLabel", () => {
  it("normaliza aberta e fechada", () => {
    expect(resolveIssueEstadoLabel({ estado: "open" })).toBe("Aberta");
    expect(resolveIssueEstadoLabel({ estado: "closed" })).toBe("Fechada");
  });
});

describe("getIssueEstadoTone", () => {
  it("usa laranja para aberta e verde para fechada", () => {
    expect(getIssueEstadoTone({ estado: "open" }).badgeClassName).toContain("orange");
    expect(getIssueEstadoTone({ estado: "closed" }).badgeClassName).toContain("emerald");
  });
});
