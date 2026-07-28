import { unstable_noStore as noStore } from "next/cache";

import {
  commonArgs,
  dateArgs,
  dateArgsIgnored,
  rpcFilterArgs,
  rpcFilterArgsForMergeadasPivot,
  rpcFilterArgsIgnoringSprintAndPeriod,
  sortFilterOptions,
  sortSprintOptions,
} from "@/lib/dashboard/filters";
import {
  type AggregateDimension,
  type AlertaDimensao,
  type MergeadasAggregateDimension,
  GITLAB_SYNC_SOURCES,
  NAO_INFORMADO,
  OUTROS,
  TODOS,
  TOP_LIMIT,
} from "@/lib/dashboard/constants";
import { cachedFetch } from "@/lib/dashboard/cache";
import { normalizeFaixaIdadeRows } from "@/lib/dashboard/faixa-idade";
import { formatIssueStatusDisplayLabel } from "@/lib/dashboard/issue-status";
import { createLiveSupabase, createStaticSupabase } from "@/lib/supabase/server";
import type {
  AlertaPorModulo,
  AlertaResumo,
  ChartPoint,
  DashboardFilters,
  DashboardKpisFull,
  FaixaIdade,
  FilterOptions,
  FluxoMensal,
  KpiPorTipo,
  LeadTimePorModulo,
  MergeadaPivotRow,
  MergeadaPorEpico,
  MergeadaPorPeriodo,
  TopLeadTime,
} from "@/types/database";

type DbClient = NonNullable<ReturnType<typeof createStaticSupabase>>;
type DbResult = { data: unknown; error: { message: string } | null };
type DbRow = Record<string, unknown>;

// --- helpers de normalização -------------------------------------------------

function num(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function numOrNull(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value);
}

function str(value: unknown, fallback = ""): string {
  return value === null || value === undefined ? fallback : String(value);
}

function strOrNull(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value);
}

// --- helpers de acesso ao Supabase ------------------------------------------
// Centralizam o padrão "obter cliente -> guardar nulo -> rodar -> tratar erro",
// que antes se repetia em todas as funções de fetch.

async function selectRows(
  label: string,
  run: (client: DbClient) => PromiseLike<DbResult>,
): Promise<DbRow[]> {
  const client = createStaticSupabase();
  if (!client) return [];

  const { data, error } = await run(client);
  if (error) {
    console.error(label, error.message);
    return [];
  }
  return (data ?? []) as DbRow[];
}

async function selectOneLive(
  label: string,
  run: (client: DbClient) => PromiseLike<DbResult>,
): Promise<DbRow | null> {
  const client = createLiveSupabase();
  if (!client) return null;

  const { data, error } = await run(client);
  if (error) {
    console.error(label, error.message);
    return null;
  }
  return (data ?? null) as DbRow | null;
}

function maxIsoTimestamp(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
}

// --- agregações genéricas ----------------------------------------------------

export const fetchAggregate = cachedFetch(
  "fetchAggregate",
  async (
    dimension: AggregateDimension,
    filters: DashboardFilters,
    options: { limit?: number; onlyAbertas?: boolean } = {},
  ): Promise<ChartPoint[]> => {
    const rows = await selectRows(`dashboard_aggregate_v2(${dimension})`, (client) =>
      client.rpc("dashboard_aggregate_v2", {
        p_dimension: dimension,
        ...commonArgs(filters),
        ...dateArgs(filters),
        p_limit: options.limit ?? null,
        p_only_abertas: Boolean(options.onlyAbertas),
      }),
    );

    return rows.map((row) => {
      const rawLabel = str(row.label, NAO_INFORMADO);
      const label =
        dimension === "status" ? formatIssueStatusDisplayLabel(rawLabel) : rawLabel;
      return {
        label,
        quantidade: num(row.quantidade),
      };
    });
  },
);

export const fetchKpis = cachedFetch(
  "fetchKpis",
  async (filters: DashboardFilters): Promise<DashboardKpisFull | null> => {
    const rows = await selectRows("dashboard_kpis_full", (client) =>
      client.rpc("dashboard_kpis_full", {
        ...commonArgs(filters),
        ...dateArgs(filters),
      }),
    );

    const row = rows[0];
    if (!row) return null;

    return {
      total: num(row.total),
      abertas: num(row.abertas),
      fechadas: num(row.fechadas),
      taxa_fechamento: num(row.taxa_fechamento),
      lead_time_medio: numOrNull(row.lead_time_medio),
      bugs_abertos: num(row.bugs_abertos),
      melhorias_abertas: num(row.melhorias_abertas),
      sem_tipo: num(row.sem_tipo),
      pct_bugs_backlog: num(row.pct_bugs_backlog),
      taxa_fech_bug: num(row.taxa_fech_bug),
      sla_acima_90: num(row.sla_acima_90),
    };
  },
);

async function fetchFluxoMensalInner(filters: DashboardFilters): Promise<FluxoMensal[]> {
  const rows = await selectRows("dashboard_fluxo_mensal", (client) =>
    client.rpc("dashboard_fluxo_mensal", rpcFilterArgsIgnoringSprintAndPeriod(filters)),
  );

  return rows.map((row) => ({
    mes: str(row.mes),
    criados: num(row.criados),
    fechados: num(row.fechados),
    backlog_liquido: num(row.backlog_liquido),
    mergeadas: num(row.mergeadas),
  }));
}

/** Sem Data Cache: mergeadas usa mergeado_em (atualizado no backfill/sync). */
export async function fetchFluxoMensal(filters: DashboardFilters): Promise<FluxoMensal[]> {
  return fetchFluxoMensalInner(filters);
}

export const fetchLeadTimePorModulo = cachedFetch(
  "fetchLeadTimePorModulo",
  async (filters: DashboardFilters): Promise<LeadTimePorModulo[]> => {
    const rows = await selectRows("dashboard_lead_time_por_modulo", (client) =>
      client.rpc("dashboard_lead_time_por_modulo", {
        ...rpcFilterArgs(filters),
        p_limit: TOP_LIMIT.leadTimePorModulo,
      }),
    );

    return rows.map((row) => ({
      modulo: str(row.modulo, NAO_INFORMADO),
      itens: num(row.itens),
      lead_medio: numOrNull(row.lead_medio),
      lead_mediano: numOrNull(row.lead_mediano),
    }));
  },
);

export const fetchKpisPorTipo = cachedFetch(
  "fetchKpisPorTipo",
  async (filters: DashboardFilters): Promise<KpiPorTipo[]> => {
    const rows = await selectRows("dashboard_kpis_por_tipo", (client) =>
      client.rpc("dashboard_kpis_por_tipo", rpcFilterArgs(filters)),
    );

    return rows.map((row) => ({
      tipo: str(row.tipo, NAO_INFORMADO),
      total: num(row.total),
      abertas: num(row.abertas),
      fechadas: num(row.fechadas),
      taxa_fechamento: num(row.taxa_fechamento),
      lead_medio: numOrNull(row.lead_medio),
      lead_mediano: numOrNull(row.lead_mediano),
    }));
  },
);

export const fetchMergeadasPorPeriodo = cachedFetch(
  "fetchMergeadasPorPeriodo",
  async (filters: DashboardFilters): Promise<MergeadaPorPeriodo[]> => {
    const rows = await selectRows("dashboard_mergeadas_por_periodo", (client) =>
      client.rpc("dashboard_mergeadas_por_periodo", {
        ...commonArgs(filters),
        ...dateArgs(filters),
      }),
    );

    return rows.map((row) => ({
      periodo: str(row.periodo, NAO_INFORMADO),
      ano: numOrNull(row.ano),
      mes: numOrNull(row.mes),
      total: num(row.total),
    }));
  },
);

export const fetchMergeadasPorEpico = cachedFetch(
  "fetchMergeadasPorEpico",
  async (
    filters: DashboardFilters,
    options: { limit?: number } = {},
  ): Promise<MergeadaPorEpico[]> => {
    const rows = await selectRows("dashboard_mergeadas_por_epico", (client) =>
      client.rpc("dashboard_mergeadas_por_epico", {
        ...commonArgs(filters),
        ...dateArgs(filters),
        p_limit: options.limit ?? null,
      }),
    );

    return rows.map((row) => ({
      epico: str(row.epico, NAO_INFORMADO),
      total: num(row.total),
    }));
  },
);

async function fetchMergeadasPivotInner(
  filters: DashboardFilters,
  linhaDimensao: "modulo" | "epico" | "parceria",
): Promise<MergeadaPivotRow[]> {
  const rows = await selectRows("dashboard_mergeadas_pivot", (client) =>
    client.rpc("dashboard_mergeadas_pivot", rpcFilterArgsForMergeadasPivot(filters, linhaDimensao)),
  );

  return rows.map((row) => ({
    linha: str(row.linha, NAO_INFORMADO),
    periodo: str(row.periodo),
    total: num(row.total),
  }));
}

/** Sem Data Cache: pivô de mergeadas depende de mergeado_em atualizado. */
export async function fetchMergeadasPivot(
  filters: DashboardFilters,
  linhaDimensao: "modulo" | "epico" | "parceria" = "modulo",
): Promise<MergeadaPivotRow[]> {
  return fetchMergeadasPivotInner(filters, linhaDimensao);
}

async function fetchMergeadasAggregateInner(
  dimension: MergeadasAggregateDimension,
  filters: DashboardFilters,
): Promise<ChartPoint[]> {
  const rows = await selectRows(`dashboard_mergeadas_aggregate(${dimension})`, (client) =>
    client.rpc("dashboard_mergeadas_aggregate", {
      p_dimension: dimension,
      ...commonArgs(filters),
      ...dateArgs(filters),
    }),
  );

  return rows.map((row) => ({
    label: str(row.label, NAO_INFORMADO),
    quantidade: num(row.quantidade),
  }));
}

/** Distribuição de mergeadas (últimos 6 meses) por parceria, tipo ou prioridade. */
export async function fetchMergeadasAggregate(
  dimension: MergeadasAggregateDimension,
  filters: DashboardFilters,
): Promise<ChartPoint[]> {
  return fetchMergeadasAggregateInner(dimension, filters);
}

export async function fetchTopLeadTimes(filters: DashboardFilters): Promise<TopLeadTime[]> {
  const rows = await selectRows("dashboard_top_lead_times", (client) =>
    client.rpc("dashboard_top_lead_times", {
      p_limit: TOP_LIMIT.topLeadTimes,
      ...commonArgs(filters),
      ...dateArgs(filters),
    }),
  );

  return rows.map((row) => ({
    id: numOrNull(row.id),
    titulo: strOrNull(row.titulo),
    modulo: strOrNull(row.modulo),
    area: strOrNull(row.area),
    estado: strOrNull(row.estado),
    status: strOrNull(row.status),
    prioridade: strOrNull(row.prioridade),
    equipe: strOrNull(row.equipe),
    criado_em: strOrNull(row.criado_em),
    fechado_em: strOrNull(row.fechado_em),
    lead_time: numOrNull(row.lead_time),
  }));
}

/** Sem Data Cache: resultados dependem dos filtros globais e da RPC 018. */
export async function fetchAlertasResumo(filters: DashboardFilters): Promise<AlertaResumo | null> {
  const rows = await selectRows("dashboard_alertas_resumo", (client) =>
    client.rpc("dashboard_alertas_resumo", {
      ...commonArgs(filters),
      ...dateArgs(filters),
    }),
  );

  const row = rows[0];
  if (!row) return null;

  return {
    abertas: num(row.abertas),
    sem_epico: num(row.sem_epico),
    sem_parceria: num(row.sem_parceria),
  };
}

/** Sem Data Cache: evita servir listas vazias após deploy da migration 018. */
export async function fetchAlertasPorModulo(
  dimensao: AlertaDimensao,
  filters: DashboardFilters,
): Promise<AlertaPorModulo[]> {
  const rows = await selectRows(`dashboard_alertas_por_modulo(${dimensao})`, (client) =>
    client.rpc("dashboard_alertas_por_modulo", {
      p_dimensao: dimensao,
      ...commonArgs(filters),
      ...dateArgs(filters),
    }),
  );

  return rows.map((row) => ({
    modulo: str(row.modulo, OUTROS),
    qtde: num(row.qtde),
    percentual: num(row.percentual),
  }));
}

async function fetchFaixaIdadeInner(filters: DashboardFilters): Promise<FaixaIdade[]> {
  const rows = await selectRows("dashboard_faixa_idade", (client) =>
    client.rpc("dashboard_faixa_idade", {
      ...commonArgs(filters),
      ...dateArgs(filters),
    }),
  );

  return normalizeFaixaIdadeRows(
    rows.map((row) => ({
      faixa: str(row.faixa),
      qtde: num(row.qtde),
      percentual: num(row.percentual),
    })),
  );
}

/** Sem Data Cache: evita servir zeros após correção da RPC no Supabase. */
export async function fetchFaixaIdade(filters: DashboardFilters): Promise<FaixaIdade[]> {
  return fetchFaixaIdadeInner(filters);
}

export const fetchQualidade = cachedFetch(
  "fetchQualidade",
  async (filters: DashboardFilters): Promise<ChartPoint[]> => {
    return _fetchQualidadeInner(filters);
  },
);

async function _fetchQualidadeInner(filters: DashboardFilters): Promise<ChartPoint[]> {
  const [moduloOk, areaOk, padraoTitulo, padraoCompleto] = await Promise.all([
    fetchAggregate("qualidade_modulo_ok", filters),
    fetchAggregate("qualidade_area_ok", filters),
    fetchAggregate("qualidade_padrao_titulo", filters),
    fetchAggregate("qualidade_padrao_completo", filters),
  ]);

  const pick = (rows: ChartPoint[], label: string) =>
    rows.find((r) => r.label.toLowerCase() === label.toLowerCase())?.quantidade ?? 0;

  return [
    { label: "Módulo OK (Sim)", quantidade: pick(moduloOk, "Sim") },
    { label: "Área OK (Sim)", quantidade: pick(areaOk, "Sim") },
    { label: "Padrão Título (Sim)", quantidade: pick(padraoTitulo, "Sim") },
    { label: "Padrão Completo (Sim)", quantidade: pick(padraoCompleto, "Sim") },
  ];
}

// --- consultas a views/tabelas ----------------------------------------------

export const fetchFilterOptions = cachedFetch(
  "filter-options",
  async (): Promise<FilterOptions> => {
    const empty: FilterOptions = {
      modulos: [TODOS],
      areas: [TODOS],
      tipos: [TODOS],
      prioridades: [TODOS],
      equipes: [TODOS],
      statuses: [TODOS],
      parcerias: [TODOS],
      sprints: [TODOS],
      epicos: [TODOS],
      repositorios: [TODOS],
      autores: [TODOS],
      anos: [],
      moduloAreaPairs: [],
    };

    const supabase = createStaticSupabase();
    if (!supabase) return empty;

    const [{ data, error }, pairsResult] = await Promise.all([
      supabase.from("v_filter_options_full").select("*").maybeSingle(),
      supabase.from("v_modulo_area_pairs").select("modulo,area"),
    ]);

    if (error || !data) return empty;

    const row = data as DbRow;
    const arr = (key: string) =>
      Array.isArray(row[key]) ? (row[key] as unknown[]).map(String) : [];
    const arrNum = (key: string) =>
      Array.isArray(row[key])
        ? (row[key] as unknown[]).map(Number).filter((n) => Number.isFinite(n))
        : [];

    const moduloAreaPairs = ((pairsResult.data ?? []) as DbRow[]).map((p) => ({
      modulo: str(p.modulo, NAO_INFORMADO),
      area: str(p.area, NAO_INFORMADO),
    }));

    return {
      modulos: sortFilterOptions(arr("modulos")),
      areas: sortFilterOptions(arr("areas")),
      tipos: sortFilterOptions(arr("tipos")),
      prioridades: sortFilterOptions(arr("prioridades")),
      equipes: sortFilterOptions(arr("equipes")),
      statuses: sortFilterOptions(arr("statuses")),
      parcerias: sortFilterOptions(arr("parcerias")),
      sprints: sortSprintOptions(arr("sprints")),
      epicos: sortFilterOptions(arr("epicos")),
      repositorios: sortFilterOptions(arr("repositorios")),
      autores: sortFilterOptions(arr("autores")),
      anos: arrNum("anos"),
      moduloAreaPairs,
    };
  },
);

export async function fetchReleases(): Promise<ChartPoint[]> {
  const rows = await selectRows("releases", (client) =>
    client
      .from("releases")
      .select("rotulo,repositorio,versao,data_release")
      .order("data_release", { ascending: false })
      .limit(12),
  );

  return rows.map((row) => ({
    label: str(row.rotulo) || `${str(row.repositorio)}: ${str(row.versao)}`,
    quantidade: 1,
  }));
}

async function fetchLastGitlabSyncFromRuns(): Promise<string | null> {
  const row = await selectOneLive("last-gitlab-sync-run", (client) =>
    client
      .from("sync_runs")
      .select("finished_at,started_at")
      .eq("status", "success")
      .in("source", [...GITLAB_SYNC_SOURCES])
      .order("finished_at", { ascending: false, nullsFirst: false })
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  );

  if (!row) return null;
  return strOrNull(row.finished_at) ?? strOrNull(row.started_at);
}

async function fetchLastGitlabSyncFromIssues(): Promise<string | null> {
  const client = createLiveSupabase();
  if (!client) return null;

  const { data, error } = await client.rpc("dashboard_last_issues_synced_at");
  if (error) {
    console.error("last-gitlab-synced-at", error.message);
    return null;
  }

  return strOrNull(data);
}

/** Última carga GitLab → Supabase. Sem cache — o header deve refletir o banco ao vivo. */
export async function fetchLastSync(): Promise<string | null> {
  noStore();
  const [fromRuns, fromIssues] = await Promise.all([
    fetchLastGitlabSyncFromRuns(),
    fetchLastGitlabSyncFromIssues(),
  ]);
  return maxIsoTimestamp(fromRuns, fromIssues);
}
