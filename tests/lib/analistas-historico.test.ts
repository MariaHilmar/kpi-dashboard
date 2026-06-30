import { beforeEach, describe, expect, it, vi } from "vitest";

type QueryResult = { data: unknown; error: { message: string } | null };

function makeQueryBuilder(result: QueryResult) {
  const builder: Record<string, unknown> = {};
  builder.select = vi.fn(() => builder);
  builder.order = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.in = vi.fn(() => builder);
  builder.then = (resolve: (value: QueryResult) => unknown) => resolve(result);
  return builder;
}

const fromMock = vi.fn();
const createServerSupabaseMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabase: async () => createServerSupabaseMock(),
}));

describe("listAnalistaRelatorios", () => {
  beforeEach(() => {
    fromMock.mockReset();
    createServerSupabaseMock.mockReset();
    createServerSupabaseMock.mockReturnValue({ from: fromMock });
  });

  it("retorna vazio quando supabase nao configurado", async () => {
    createServerSupabaseMock.mockReturnValueOnce(null);
    const { listAnalistaRelatorios } = await import("@/lib/dashboard/analistas");

    expect(await listAnalistaRelatorios()).toEqual([]);
  });

  it("combina relatorios com nome/email do perfil", async () => {
    const relatoriosBuilder = makeQueryBuilder({
      data: [
        {
          id: "r1",
          user_id: "u1",
          ano_mes: "2026/05",
          sprint: "Sprint 89",
          outras_atividades: "QA das issues",
          status: "publicado",
          publicado_em: "2026-05-30T00:00:00Z",
          updated_at: "2026-05-30T00:00:00Z",
        },
      ],
      error: null,
    });
    const profilesBuilder = makeQueryBuilder({
      data: [{ id: "u1", full_name: "Maria Hilmar", email: "maria@example.com" }],
      error: null,
    });

    fromMock.mockImplementation((table: string) =>
      table === "analista_relatorios" ? relatoriosBuilder : profilesBuilder,
    );

    const { listAnalistaRelatorios } = await import("@/lib/dashboard/analistas");
    const result = await listAnalistaRelatorios();

    expect(result).toHaveLength(1);
    expect(result[0].autor_nome).toBe("Maria Hilmar");
    expect(result[0].autor_email).toBe("maria@example.com");
    expect(result[0].status).toBe("publicado");
  });

  it("retorna vazio quando a query de relatorios falha", async () => {
    const relatoriosBuilder = makeQueryBuilder({ data: null, error: { message: "erro" } });
    fromMock.mockReturnValue(relatoriosBuilder);

    const { listAnalistaRelatorios } = await import("@/lib/dashboard/analistas");
    expect(await listAnalistaRelatorios()).toEqual([]);
  });
});
