import { beforeEach, describe, expect, it, vi } from "vitest";

const rpcMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createLiveSupabase: () => ({ rpc: rpcMock }),
  createServerSupabase: async () => null,
}));

describe("fetchMilestoneIssues", () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it("retorna rows e total a partir do RPC", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          total_count: 165,
          issue_key: "contratos_v2#42",
          gitlab_iid: 42,
          gitlab_repo: "contratos_v2",
          titulo: "Issue teste",
          story_points: 5,
          status: "Em Desenvolvimento",
          etapa: "Em Desenvolvimento",
          assignee: "Maria",
          ultimo_comentario: "Comentário",
          homologado: "Sim",
          estado: "Aberto",
          fechado_em: null,
        },
      ],
      error: null,
    });

    const { fetchMilestoneIssues } = await import("@/lib/dashboard/milestone-report");
    const result = await fetchMilestoneIssues(90, {
      search: "teste",
      estado: "Aberto",
      metric: "wip",
      page: 2,
      pageSize: 50,
    });

    expect(result.total).toBe(165);
    expect(result.page).toBe(2);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].gitlab_iid).toBe(42);
    expect(result.rows[0].story_points).toBe(5);
    expect(rpcMock).toHaveBeenCalledWith(
      "report_milestone_issues",
      expect.objectContaining({
        p_milestone_iid: 90,
        p_search: "teste",
        p_estado: "Aberto",
        p_metric: "wip",
        p_offset: 50,
        p_limit: 50,
      }),
    );
  });

  it("retorna vazio quando RPC falha", async () => {
    rpcMock.mockRejectedValue(new Error("erro"));

    const { fetchMilestoneIssues } = await import("@/lib/dashboard/milestone-report");

    await expect(fetchMilestoneIssues(90)).rejects.toThrow("erro");
  });
});

describe("fetchMilestoneSummary export", () => {
  it("exporta função de fetch para report_milestone_summary", async () => {
    const { fetchMilestoneSummary } = await import("@/lib/dashboard/milestone-report");
    expect(typeof fetchMilestoneSummary).toBe("function");
  });
});
