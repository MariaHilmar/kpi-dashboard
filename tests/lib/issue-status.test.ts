import { describe, expect, it } from "vitest";

import {
  getIssueStatusChartHex,
  getIssueStatusTone,
  resolveIssueStatusLabel,
  resolveIssueWorkflowStatusLabel,
} from "@/lib/dashboard/issue-status";
import type { IssueRow } from "@/lib/dashboard/issues";

const baseRow: Pick<IssueRow, "status" | "estado"> = {
  status: null,
  estado: "open",
};

describe("resolveIssueStatusLabel", () => {
  it("prioriza label GitLab quando presente", () => {
    expect(resolveIssueStatusLabel({ ...baseRow, status: "Doing" })).toBe("Em execução");
  });

  it("usa Aberta/Fechada quando status está vazio", () => {
    expect(resolveIssueStatusLabel({ status: null, estado: "open" })).toBe("Aberta");
    expect(resolveIssueStatusLabel({ status: "", estado: "closed" })).toBe("Fechada");
  });
});

describe("resolveIssueWorkflowStatusLabel", () => {
  it("retorna apenas o workflow GitLab", () => {
    expect(
      resolveIssueWorkflowStatusLabel({ status: "Doing" }),
    ).toBe("Em execução");
    expect(resolveIssueWorkflowStatusLabel({ status: null })).toBe("—");
  });
});

describe("getIssueStatusTone", () => {
  it("mapeia status conhecidos com cores estáveis", () => {
    expect(getIssueStatusTone("Backlog").chartHex).toBe("#64748B");
    expect(getIssueStatusTone("Doing").chartHex).toBe("#1351B4");
    expect(getIssueStatusTone("Em execução").chartHex).toBe("#1351B4");
    expect(getIssueStatusTone("Delivered").chartHex).toBe("#168821");
  });

  it("reutiliza a mesma cor para status desconhecido", () => {
    const first = getIssueStatusChartHex("Status Customizado");
    const second = getIssueStatusChartHex("Status Customizado");
    expect(first).toBe(second);
  });
});
