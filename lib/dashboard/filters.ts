import { NAO_INFORMADO, DEFAULT_PERIODO_TIPO, PERIODO_TIPOS, TODOS, type PeriodoTipo } from "@/lib/dashboard/constants";
import { resolvePeriodDates } from "@/lib/dashboard/period-filter";
import type { DashboardFilters } from "@/types/database";

export const DEFAULT_FILTERS: DashboardFilters = {
  modulo: TODOS,
  area: TODOS,
  tipo: TODOS,
  prioridade: TODOS,
  equipe: TODOS,
  status: TODOS,
  parceria: TODOS,
  sprint: TODOS,
  epico: TODOS,
  repositorio: TODOS,
  situacao: TODOS,
  /** @deprecated Preferir periodoDe/periodoAte; mantido para URLs legadas (?ano=). */
  ano: null,
  periodoTipo: DEFAULT_PERIODO_TIPO,
  periodoDe: null,
  periodoAte: null,
  criadoDe: null,
  criadoAte: null,
  fechadoDe: null,
  fechadoAte: null,
  mergeadoDe: null,
  mergeadoAte: null,
};

function strOr(value: string | string[] | undefined, fallback: string = TODOS): string {
  if (typeof value !== "string" || value === "") return fallback;
  return value;
}

function dateOr(value: string | string[] | undefined): string | null {
  if (typeof value !== "string" || value === "") return null;
  return value;
}

function periodoTipoOr(value: string | string[] | undefined): PeriodoTipo {
  if (typeof value === "string" && (PERIODO_TIPOS as readonly string[]).includes(value)) {
    return value as PeriodoTipo;
  }
  return DEFAULT_PERIODO_TIPO;
}

export function parseFilters(
  searchParams: Record<string, string | string[] | undefined>,
): DashboardFilters {
  const anoRaw = typeof searchParams.ano === "string" ? searchParams.ano : "";
  const ano = anoRaw && anoRaw !== TODOS ? Number(anoRaw) : null;

  const periodoDe = dateOr(searchParams.periodoDe);
  const periodoAte = dateOr(searchParams.periodoAte);
  const periodoTipo = periodoTipoOr(searchParams.periodoTipo);

  const filters: DashboardFilters = {
    modulo: strOr(searchParams.modulo),
    area: strOr(searchParams.area),
    tipo: strOr(searchParams.tipo),
    prioridade: strOr(searchParams.prioridade),
    equipe: strOr(searchParams.equipe),
    status: strOr(searchParams.status),
    parceria: strOr(searchParams.parceria),
    sprint: strOr(searchParams.sprint),
    epico: strOr(searchParams.epico),
    repositorio: strOr(searchParams.repositorio),
    situacao: strOr(searchParams.situacao),
    ano: Number.isFinite(ano) ? ano : null,
    periodoTipo,
    periodoDe,
    periodoAte,
    criadoDe: null,
    criadoAte: null,
    fechadoDe: null,
    fechadoAte: null,
    mergeadoDe: null,
    mergeadoAte: null,
  };

  const resolved = resolvePeriodDates(filters);
  return {
    ...filters,
    criadoDe: resolved.criadoDe,
    criadoAte: resolved.criadoAte,
    fechadoDe: resolved.fechadoDe,
    fechadoAte: resolved.fechadoAte,
    mergeadoDe: resolved.mergeadoDe,
    mergeadoAte: resolved.mergeadoAte,
    ano: resolved.criadoDe || resolved.fechadoDe || resolved.mergeadoDe ? null : filters.ano,
  };
}

export function commonArgs(filters: DashboardFilters) {
  return {
    p_modulo: filters.modulo,
    p_area: filters.area,
    p_tipo: filters.tipo,
    p_prioridade: filters.prioridade,
    p_equipe: filters.equipe,
    p_status: filters.status,
    p_parceria: filters.parceria,
    p_sprint: filters.sprint,
    p_epico: filters.epico,
    p_repositorio: filters.repositorio,
    p_situacao: filters.situacao,
    p_ano: filters.ano,
  };
}

export function dateArgs(filters: DashboardFilters) {
  return {
    p_criado_de: filters.criadoDe,
    p_criado_ate: filters.criadoAte,
    p_fechado_de: filters.fechadoDe,
    p_fechado_ate: filters.fechadoAte,
    p_mergeado_de: filters.mergeadoDe,
    p_mergeado_ate: filters.mergeadoAte,
  };
}

/** Pivô de mergeadas ignora filtro de período (sempre últimos 6 meses do merge). */
export function dateArgsIgnored() {
  return {
    p_criado_de: null,
    p_criado_ate: null,
    p_fechado_de: null,
    p_fechado_ate: null,
    p_mergeado_de: null,
    p_mergeado_ate: null,
    p_ano: null,
  };
}

/**
 * Evolução mensal e pivô de mergeadas ignoram Sprint e Período globais.
 * Demais filtros (módulo, área, tipo, etc.) continuam valendo.
 */
export function rpcFilterArgsIgnoringSprintAndPeriod(filters: DashboardFilters) {
  return {
    ...commonArgs({ ...filters, sprint: TODOS, ano: null }),
    ...dateArgsIgnored(),
  };
}

export function rpcFilterArgs(filters: DashboardFilters) {
  return {
    ...commonArgs(filters),
    ...dateArgs(filters),
  };
}

export function filtersToSearchParams(
  filters: Partial<DashboardFilters> | null | undefined,
): URLSearchParams {
  const params = new URLSearchParams();
  if (!filters) return params;

  const skip = new Set([
    "criadoDe",
    "criadoAte",
    "fechadoDe",
    "fechadoAte",
    "mergeadoDe",
    "mergeadoAte",
    "ano",
  ]);

  for (const [key, value] of Object.entries(filters)) {
    if (skip.has(key)) continue;
    if (value === null || value === undefined || value === "" || value === TODOS) continue;
    if (key === "periodoTipo" && value === DEFAULT_PERIODO_TIPO && !filters.periodoDe && !filters.periodoAte) {
      continue;
    }
    params.set(key, String(value));
  }
  return params;
}

/** Garante que o valor selecionado na URL apareça nas opções do select. */
export function ensureFilterOption(options: string[], value: string): string[] {
  if (!value || value === TODOS || options.includes(value)) return options;
  return sortFilterOptions([...options, value]);
}

/** Ordem padrão: Todos → Não informado → demais (A–Z). */
export function sortFilterOptions(values: string[]): string[] {
  const rest: string[] = [];
  let hasNaoInformado = false;

  for (const value of values) {
    if (value === TODOS) continue;
    if (value === NAO_INFORMADO) {
      hasNaoInformado = true;
      continue;
    }
    rest.push(value);
  }

  rest.sort((a, b) => a.localeCompare(b, "pt-BR"));

  const result = [TODOS];
  if (hasNaoInformado) result.push(NAO_INFORMADO);
  return [...result, ...rest];
}

/** Sprints: Todos → Não informado → Sprint N (decrescente). */
export function sortSprintOptions(values: string[]): string[] {
  const numbered: { label: string; num: number }[] = [];
  let hasNaoInformado = false;

  for (const value of values) {
    if (value === TODOS) continue;
    if (value === NAO_INFORMADO) {
      hasNaoInformado = true;
      continue;
    }
    const match = value.match(/(\d+)/);
    numbered.push({ label: value, num: match ? Number(match[1]) : 0 });
  }

  numbered.sort((a, b) => b.num - a.num);

  const result = [TODOS];
  if (hasNaoInformado) result.push(NAO_INFORMADO);
  return [...result, ...numbered.map((item) => item.label)];
}

/** Retorna a sprint mais recente (maior número) ou null se não houver. */
export function resolveLatestSprint(sprints: string[]): string | null {
  const sorted = sortSprintOptions(sprints);
  return sorted.find((sprint) => sprint !== TODOS && sprint !== NAO_INFORMADO && /\d+/.test(sprint)) ?? null;
}
