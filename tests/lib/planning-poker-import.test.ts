import { describe, expect, it, vi } from "vitest";

import { makeIssueKeyFromParts, repoDisplayName } from "@/lib/dashboard/gitlab-url";
import {
  buildPlanningPokerTemplateWorkbook,
  importPlanningPokerRows,
  issuePatchFromRow,
  loadPlanningPokerFromBuffer,
  mapHeaders,
  parseMappedRow,
  parseNumber,
  parseSheetRows,
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

  it("parseNumber aceita vírgula decimal", () => {
    expect(parseNumber("8,5")).toBe(8.5);
    expect(parseNumber("")).toBeNull();
  });

  it("parseSheetRows exige coluna gitlab_iid", () => {
    expect(() => parseSheetRows(["gitlab_repo"], [["contratos_v2"]])).toThrow(
      /gitlab_iid/i,
    );
  });

  it("loadPlanningPokerFromBuffer lê CSV válido", async () => {
    const csv = "gitlab_repo,gitlab_iid,story_points\ncontratos_v2,42,3\n";
    const buffer = new TextEncoder().encode(csv).buffer;

    const rows = await loadPlanningPokerFromBuffer(buffer, "dados.csv");
    expect(rows).toHaveLength(1);
    expect(rows[0].gitlab_iid).toBe(42);
    expect(rows[0].story_points).toBe(3);
  });

  it("buildPlanningPokerTemplateWorkbook gera buffer xlsx", async () => {
    const buffer = await buildPlanningPokerTemplateWorkbook();
    expect(buffer.byteLength).toBeGreaterThan(0);
  });

  it("issuePatchFromRow remove campos nulos e inclui milestone", () => {
    const patch = issuePatchFromRow(
      {
        issue_key: "Contratos v2:1",
        gitlab_repo: "contratos_v2",
        gitlab_iid: 1,
        story_points: 5,
        aceita: null,
        sprint: "Sprint 90",
      },
      90,
    );

    expect(patch.story_points).toBe(5);
    expect(patch.sprint).toBe("Sprint 90");
    expect(patch.milestone_gitlab_id).toBe(90);
    expect(patch).not.toHaveProperty("aceita");
    expect(patch).toHaveProperty("report_fields_synced_at");
  });

  it("importPlanningPokerRows atualiza issue encontrada", async () => {
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "milestone_import_runs") {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({ data: { id: "run-1" }, error: null }),
              })),
            })),
            update: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({ error: null }),
            })),
          };
        }

        if (table === "issues") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  limit: vi.fn(() => ({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: { issue_key: "Contratos v2:1" },
                      error: null,
                    }),
                  })),
                })),
                limit: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { issue_key: "Contratos v2:1" },
                    error: null,
                  }),
                })),
              })),
            })),
            update: vi.fn(() => ({
              eq: updateEq,
            })),
          };
        }

        return {};
      }),
    };

    const stats = await importPlanningPokerRows(supabase as never, [
      {
        issue_key: "Contratos v2:1",
        gitlab_repo: "contratos_v2",
        gitlab_iid: 1,
        story_points: 5,
      },
    ]);

    expect(stats.processed).toBe(1);
    expect(stats.upserted_issues).toBe(1);
    expect(stats.errors).toBe(0);
    expect(updateEq).toHaveBeenCalled();
  });
});
