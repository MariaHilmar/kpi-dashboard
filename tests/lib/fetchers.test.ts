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

function queryChain(finalResult: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn(function select() {
      return chain;
    }),
    order: vi.fn(function order() {
      return chain;
    }),
    limit: vi.fn(async function limit() {
      return finalResult;
    }),
    eq: vi.fn(function eq() {
      return chain;
    }),
    maybeSingle: vi.fn(async function maybeSingle() {
      return finalResult;
    }),
  };
  return chain;
}

function queryChainWithMaybeSingle(finalResult: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn(function select() {
      return chain;
    }),
    order: vi.fn(function order() {
      return chain;
    }),
    limit: vi.fn(function limit() {
      return chain;
    }),
    eq: vi.fn(function eq() {
      return chain;
    }),
    maybeSingle: vi.fn(async function maybeSingle() {
      return finalResult;
    }),
  };
  return chain;
}

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabase: () => createServerSupabaseMock(),
}));

describe("fetchers", () => {
  beforeEach(() => {
    rpcMock.mockReset();
    fromMock.mockReset();
    createServerSupabaseMock.mockReturnValue({
      rpc: rpcMock,
      from: fromMock,
    });
  });

  it("fetchAggregate mapeia linhas do RPC", async () => {
    rpcMock.mockResolvedValue({
      data: [
        { label: "Bug", quantidade: 10 },
        { label: null, quantidade: null },
      ],
      error: null,
    });

    const { fetchAggregate } = await import("@/lib/dashboard/fetchers");
    const result = await fetchAggregate("tipo", DEFAULT_FILTERS, {
      limit: 5,
      onlyAbertas: true,
    });

    expect(result).toEqual([
      { label: "Bug", quantidade: 10 },
      { label: "Não informado", quantidade: 0 },
    ]);
    expect(rpcMock).toHaveBeenCalledWith(
      "dashboard_aggregate_v2",
      expect.objectContaining({
        p_dimension: "tipo",
        p_limit: 5,
        p_only_abertas: true,
      }),
    );
  });

  it("fetchAggregate retorna vazio em erro", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "fail" } });
    const { fetchAggregate } = await import("@/lib/dashboard/fetchers");
    expect(await fetchAggregate("tipo", DEFAULT_FILTERS)).toEqual([]);
  });

  it("fetchKpis normaliza numeros", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          total: "100",
          abertas: 40,
          fechadas: 60,
          taxa_fechamento: "60.5",
          lead_time_medio: 14.2,
          bugs_abertos: 5,
          melhorias_abertas: 3,
          sem_tipo: 2,
          pct_bugs_backlog: 12.5,
          taxa_fech_bug: 80,
          sla_acima_90: 7,
        },
      ],
      error: null,
    });

    const { fetchKpis } = await import("@/lib/dashboard/fetchers");
    const kpis = await fetchKpis(DEFAULT_FILTERS);

    expect(kpis?.lead_time_medio).toBe(14.2);
    expect(kpis?.total).toBe(100);
  });

  it("fetchKpis retorna null sem dados", async () => {
    rpcMock.mockResolvedValue({ data: [], error: null });
    const { fetchKpis } = await import("@/lib/dashboard/fetchers");
    expect(await fetchKpis(DEFAULT_FILTERS)).toBeNull();
  });

  it("fetchFluxoMensal mapeia meses", async () => {
    rpcMock.mockResolvedValue({
      data: [{ mes: "2024-06", criados: "10", fechados: 8, backlog_liquido: 2 }],
      error: null,
    });

    const { fetchFluxoMensal } = await import("@/lib/dashboard/fetchers");
    expect(await fetchFluxoMensal(DEFAULT_FILTERS)).toEqual([
      { mes: "2024-06", criados: 10, fechados: 8, backlog_liquido: 2 },
    ]);
  });

  it("fetchLeadTimePorModulo mapeia modulos", async () => {
    rpcMock.mockResolvedValue({
      data: [{ modulo: "PNCP", itens: 5, lead_medio: 10, lead_mediano: null }],
      error: null,
    });

    const { fetchLeadTimePorModulo } = await import("@/lib/dashboard/fetchers");
    expect(await fetchLeadTimePorModulo({ ...DEFAULT_FILTERS, ano: 2024 })).toEqual([
      { modulo: "PNCP", itens: 5, lead_medio: 10, lead_mediano: null },
    ]);
  });

  it("fetchKpisPorTipo mapeia tipos", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          tipo: "Bug",
          total: 20,
          abertas: 5,
          fechadas: 15,
          taxa_fechamento: 75,
          lead_medio: 8,
          lead_mediano: 6,
        },
      ],
      error: null,
    });

    const { fetchKpisPorTipo } = await import("@/lib/dashboard/fetchers");
    const rows = await fetchKpisPorTipo(DEFAULT_FILTERS);
    expect(rows[0].tipo).toBe("Bug");
    expect(rows[0].taxa_fechamento).toBe(75);
  });

  it("fetchTopLeadTimes mapeia issues", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          id: 42,
          titulo: "Issue",
          modulo: "PNCP",
          area: "PNCP",
          estado: "closed",
          status: "Done",
          prioridade: "high",
          equipe: "Alpha",
          criado_em: "2024-01-01",
          fechado_em: "2024-06-01",
          lead_time: 150,
        },
      ],
      error: null,
    });

    const { fetchTopLeadTimes } = await import("@/lib/dashboard/fetchers");
    const rows = await fetchTopLeadTimes({ ...DEFAULT_FILTERS, ano: 2024 });
    expect(rows[0].id).toBe(42);
    expect(rows[0].lead_time).toBe(150);
  });

  it("fetchAlertasPorModulo mapeia dimensao", async () => {
    rpcMock.mockResolvedValue({
      data: [{ modulo: "PNCP", qtde: 3, percentual: "25.5" }],
      error: null,
    });

    const { fetchAlertasPorModulo } = await import("@/lib/dashboard/fetchers");
    expect(await fetchAlertasPorModulo("sem_epico")).toEqual([
      { modulo: "PNCP", qtde: 3, percentual: 25.5 },
    ]);
  });

  it("fetchFaixaIdade mapeia faixas", async () => {
    rpcMock.mockResolvedValue({
      data: [{ faixa: "0-30", qtde: 10, percentual: 40 }],
      error: null,
    });

    const { fetchFaixaIdade } = await import("@/lib/dashboard/fetchers");
    expect(await fetchFaixaIdade()).toEqual([
      { faixa: "0-30", qtde: 10, percentual: 40 },
    ]);
  });

  it("fetchQualidade agrega metricas Sim", async () => {
    rpcMock
      .mockResolvedValueOnce({ data: [{ label: "Sim", quantidade: 80 }], error: null })
      .mockResolvedValueOnce({ data: [{ label: "Sim", quantidade: 70 }], error: null })
      .mockResolvedValueOnce({ data: [{ label: "sim", quantidade: 60 }], error: null })
      .mockResolvedValueOnce({ data: [{ label: "Sim", quantidade: 50 }], error: null });

    const { fetchQualidade } = await import("@/lib/dashboard/fetchers");
    const result = await fetchQualidade(DEFAULT_FILTERS);

    expect(result).toEqual([
      { label: "Módulo OK (Sim)", quantidade: 80 },
      { label: "Área OK (Sim)", quantidade: 70 },
      { label: "Padrão Título (Sim)", quantidade: 60 },
      { label: "Padrão Completo (Sim)", quantidade: 50 },
    ]);
  });

  it("fetchAlertasResumo normaliza contadores", async () => {
    rpcMock.mockResolvedValue({
      data: [{ abertas: "10", sem_epico: 3, sem_parceria: 2 }],
      error: null,
    });

    const { fetchAlertasResumo } = await import("@/lib/dashboard/fetchers");
    expect(await fetchAlertasResumo()).toEqual({
      abertas: 10,
      sem_epico: 3,
      sem_parceria: 2,
    });
  });

  it("fetchFilterOptions monta listas ordenadas", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "v_filter_options_full") {
        return queryChainWithMaybeSingle({
          data: {
            modulos: ["PNCP", "Todos", "Não informado"],
            areas: ["PNCP"],
            tipos: ["Bug"],
            prioridades: ["high"],
            equipes: ["Alpha"],
            statuses: ["Em andamento"],
            parcerias: ["Beta"],
            sprints: ["Sprint 2", "Sprint 10"],
            epicos: ["Epico"],
            repositorios: ["contratos_v2"],
            anos: [2024, 2025],
          },
          error: null,
        });
      }
      return {
        select: vi.fn(async () => ({
          data: [{ modulo: "PNCP", area: "PNCP" }],
          error: null,
        })),
      };
    });

    const { fetchFilterOptions } = await import("@/lib/dashboard/fetchers");
    const options = await fetchFilterOptions();

    expect(options.modulos[0]).toBe("Todos");
    expect(options.modulos).toContain("PNCP");
    expect(options.sprints).toEqual(["Todos", "Sprint 10", "Sprint 2"]);
    expect(options.moduloAreaPairs).toEqual([{ modulo: "PNCP", area: "PNCP" }]);
    expect(options.anos).toEqual([2024, 2025]);
  });

  it("fetchFilterOptions retorna vazio sem supabase", async () => {
    createServerSupabaseMock.mockReturnValueOnce(null);

    const { fetchFilterOptions } = await import("@/lib/dashboard/fetchers");
    const options = await fetchFilterOptions();
    expect(options.modulos).toEqual(["Todos"]);
  });

  it("fetchReleases mapeia rotulos", async () => {
    fromMock.mockReturnValue(
      queryChain({
        data: [
          { rotulo: "v1.0", repositorio: "contratos_v2", versao: "1.0", data_release: "2024-01-01" },
          { rotulo: null, repositorio: "contratos", versao: "2.0", data_release: "2024-02-01" },
        ],
        error: null,
      }),
    );

    const { fetchReleases } = await import("@/lib/dashboard/fetchers");
    const releases = await fetchReleases();
    expect(releases).toEqual([
      { label: "v1.0", quantidade: 1 },
      { label: "contratos: 2.0", quantidade: 1 },
    ]);
  });

  it("fetchLastSync retorna finished_at", async () => {
    fromMock.mockReturnValue(
      queryChainWithMaybeSingle({
        data: {
          finished_at: "2024-06-01T10:00:00Z",
          started_at: "2024-06-01T09:00:00Z",
          status: "success",
        },
        error: null,
      }),
    );

    const { fetchLastSync } = await import("@/lib/dashboard/fetchers");
    expect(await fetchLastSync()).toBe("2024-06-01T10:00:00Z");
  });

  it("fetchLastSync usa started_at como fallback", async () => {
    fromMock.mockReturnValue(
      queryChainWithMaybeSingle({
        data: {
          finished_at: null,
          started_at: "2024-06-01T09:00:00Z",
          status: "success",
        },
        error: null,
      }),
    );

    const { fetchLastSync } = await import("@/lib/dashboard/fetchers");
    expect(await fetchLastSync()).toBe("2024-06-01T09:00:00Z");
  });
});
