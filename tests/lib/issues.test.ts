import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_FILTERS } from "@/lib/dashboard/filters";

const rpcMock = vi.fn();
const fromMock = vi.fn();
const createServerSupabaseMock = vi.fn(
  (): { rpc: typeof rpcMock; from: typeof fromMock } | null => ({
    rpc: rpcMock,
    from: fromMock,
  }),
);

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabase: () => createServerSupabaseMock(),
}));

describe("searchIssues", () => {
  beforeEach(() => {
    rpcMock.mockReset();
    createServerSupabaseMock.mockReturnValue({
      rpc: rpcMock,
      from: fromMock,
    });
  });

  it("retorna rows e total a partir do RPC", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          total_count: 120,
          gitlab_iid: 42,
          gitlab_repo: "contratos_v2",
          titulo: "Issue teste",
          modulo: "PNCP",
          estado: "open",
        },
      ],
      error: null,
    });

    const { searchIssues } = await import("@/lib/dashboard/issues");
    const result = await searchIssues(DEFAULT_FILTERS, {
      search: "teste",
      estado: "open",
      sla: "Todos",
      order: "criado_em_desc",
      page: 2,
      pageSize: 50,
    });

    expect(result.total).toBe(120);
    expect(result.page).toBe(2);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].gitlab_iid).toBe(42);
    expect(rpcMock).toHaveBeenCalledWith(
      "search_issues",
      expect.objectContaining({
        p_search: "teste",
        p_estado: "open",
        p_offset: 50,
        p_limit: 50,
      }),
    );
  });

  it("retorna vazio quando RPC falha", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "erro" } });

    const { searchIssues } = await import("@/lib/dashboard/issues");
    const result = await searchIssues(DEFAULT_FILTERS, {
      search: "",
      estado: "Todos",
      sla: "Todos",
      order: "criado_em_desc",
      page: 1,
      pageSize: 50,
    });

    expect(result).toEqual({ rows: [], total: 0, page: 1, pageSize: 50 });
  });

  it("retorna vazio quando supabase nao configurado", async () => {
    createServerSupabaseMock.mockReturnValueOnce(null);

    const { searchIssues } = await import("@/lib/dashboard/issues");
    const result = await searchIssues(DEFAULT_FILTERS, {
      search: "",
      estado: "Todos",
      sla: "Todos",
      order: "criado_em_desc",
      page: 1,
      pageSize: 50,
    });

    expect(result).toEqual({ rows: [], total: 0, page: 1, pageSize: 50 });
  });

  it("total zero quando RPC retorna lista vazia", async () => {
    rpcMock.mockResolvedValue({ data: [], error: null });

    const { searchIssues } = await import("@/lib/dashboard/issues");
    const result = await searchIssues(DEFAULT_FILTERS, {
      search: "",
      estado: "Todos",
      sla: "Todos",
      order: "criado_em_desc",
      page: 1,
      pageSize: 50,
    });

    expect(result.total).toBe(0);
    expect(result.rows).toEqual([]);
  });
});
