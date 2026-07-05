import { describe, expect, it } from "vitest";

import { makeIssueKeyFromParts, repoDisplayName } from "@/lib/dashboard/gitlab-url";
import {
  mapHeaders,
  parseMappedRow,
  validatePlanningPokerRows,
} from "@/lib/dashboard/planning-poker-import";

describe("planning-poker-import", () => {
  it("mapeia cabeçalhos alternativos", () => {
    const mapping = mapHeaders(["Repositorio", "ID", "Pontos", "Milestone"]);
    expect(mapping.gitlab_repo).toBe("Repositorio");
    expect(mapping.gitlab_iid).toBe("ID");
    expect(mapping.story_points).toBe("Pontos");
    expect(mapping.sprint).toBe("Milestone");
  });

  it("parseia linha com issue_key no formato do banco", () => {
    const mapping = mapHeaders(["gitlab_repo", "gitlab_iid", "story_points"]);
    const row = parseMappedRow(
      { gitlab_repo: "contratos_v2", gitlab_iid: 1349, story_points: 5 },
      mapping,
    );

    expect(row).not.toBeNull();
    expect(row?.gitlab_iid).toBe(1349);
    expect(row?.gitlab_repo).toBe("contratos_v2");
    expect(row?.issue_key).toBe(makeIssueKeyFromParts("contratos_v2", 1349));
    expect(row?.issue_key).toBe(`${repoDisplayName("contratos_v2")}:1349`);
    expect(row?.story_points).toBe(5);
  });

  it("mapeia coluna historico para ultimo_comentario", () => {
    const mapping = mapHeaders([
      "gitlab_repo",
      "gitlab_iid",
      "historico_issue",
      "historico",
    ]);
    const row = parseMappedRow(
      {
        gitlab_repo: "contratos_v2",
        gitlab_iid: 100,
        historico_issue: "Não",
        historico: "Aguardando PO",
      },
      mapping,
    );

    expect(row?.historico).toBe("Não");
    expect(row?.ultimo_comentario).toBe("Aguardando PO");
  });

  it("ignora linhas sem gitlab_iid", () => {
    const mapping = mapHeaders(["gitlab_repo", "gitlab_iid"]);
    expect(parseMappedRow({ gitlab_repo: "contratos_v2", gitlab_iid: "" }, mapping)).toBeNull();
  });

  it("valida duplicatas e fibonacci", () => {
    const rows = [
      {
        issue_key: "Contratos v2:1",
        gitlab_repo: "contratos_v2",
        gitlab_iid: 1,
        story_points: 4,
      },
      {
        issue_key: "Contratos v2:1",
        gitlab_repo: "contratos_v2",
        gitlab_iid: 1,
        story_points: 5,
      },
    ];

    const warnings = validatePlanningPokerRows(rows);
    expect(warnings.some((w) => w.includes("duplicada"))).toBe(true);
    expect(warnings.some((w) => w.includes("story_points=4"))).toBe(true);
  });
});
