import { NAO_INFORMADO, DEFAULT_PERIODO_TIPO, PERIODO_TIPOS, TODOS, type PeriodoTipo } from "@/lib/dashboard/constants";
import type { DashboardFilters, ModuloAreaPair } from "@/types/database";
import {
  defaultPeriodRange,
  hasActiveGlobalPeriodFilter,
  PERIODO_TODOS,
  resolvePeriodDates,
} from "@/lib/dashboard/period-filter";

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

  let periodoDe = dateOr(searchParams.periodoDe);
  let periodoAte = dateOr(searchParams.periodoAte);
  let periodoTipo = periodoTipoOr(searchParams.periodoTipo);

  // Default do filtro global: sem período/ano na URL e sem o sentinela ?periodo=todos,
  // aplica os últimos 6 meses por data de fechamento. O usuário pode limpar (?periodo=todos)
  // ou informar outro intervalo/ano.
  const periodoTodos = searchParams.periodo === PERIODO_TODOS;
  if (!periodoTodos && !periodoDe && !periodoAte && ano == null) {
    const def = defaultPeriodRange();
    periodoDe = def.de;
    periodoAte = def.ate;
    periodoTipo = "fechamento";
  }

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

/**
 * Pivô de mergeadas ignora sprint; ignora período global apenas quando período não está informado.
 */
export function rpcFilterArgsForMergeadasPivot(
  filters: DashboardFilters,
  linhaDimensao: "modulo" | "epico" | "parceria",
) {
  const base = commonArgs({ ...filters, sprint: TODOS, ano: null });
  const dates = hasActiveGlobalPeriodFilter(filters) ? dateArgs(filters) : dateArgsIgnored();

  return {
    ...base,
    ...dates,
    p_linha_dimensao: linhaDimensao,
  };
}

/** Pivô legado / evolução mensal: ignora datas globais. */
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

function normalizeFilterKey(value: string): string {
  return value.trim().toLocaleLowerCase("pt-BR");
}

/** Índice módulo → áreas a partir dos pares carregados do banco. */
export function buildModuloAreaIndex(pairs: ModuloAreaPair[]): Map<string, string[]> {
  const grouped = new Map<string, Set<string>>();

  for (const { modulo, area } of pairs) {
    const moduloKey = modulo.trim();
    const areaKey = area.trim();
    if (!moduloKey || !areaKey) continue;
    if (!grouped.has(moduloKey)) grouped.set(moduloKey, new Set());
    grouped.get(moduloKey)!.add(areaKey);
  }

  const index = new Map<string, string[]>();
  for (const [modulo, areas] of grouped) {
    index.set(
      modulo,
      sortFilterOptions(Array.from(areas)).filter((area) => area !== TODOS),
    );
  }
  return index;
}

/** Áreas do módulo selecionado (com fallback de comparação sem acento). */
function lookupAreasByModulo(
  getAreas: (key: string) => string[] | undefined,
  keys: Iterable<string>,
  modulo: string,
  normalize: boolean,
): string[] {
  if (!modulo || modulo === TODOS) return [];

  const finish = (areas: string[]) =>
    normalize ? sortFilterOptions(areas).filter((area) => area !== TODOS) : areas;

  const direct = getAreas(modulo);
  if (direct?.length) return finish(direct);

  const target = normalizeFilterKey(modulo);
  for (const key of keys) {
    if (normalizeFilterKey(key) !== target) continue;
    const areas = getAreas(key);
    if (areas && areas.length > 0) return finish(areas);
  }

  return [];
}

export function areasForModulo(index: Map<string, string[]>, modulo: string): string[] {
  return lookupAreasByModulo((key) => index.get(key), index.keys(), modulo, false);
}

/** Módulos que contêm a área selecionada (com fallback de comparação sem acento). */
function collectModulosForArea(
  entries: Iterable<[string, string[]]>,
  area: string,
): string[] {
  if (!area || area === TODOS) return [];

  const modulos = new Set<string>();
  const target = normalizeFilterKey(area);

  for (const [modulo, areas] of entries) {
    if (areas.includes(area) || areas.some((item) => normalizeFilterKey(item) === target)) {
      modulos.add(modulo);
    }
  }

  return sortFilterOptions(Array.from(modulos)).filter((modulo) => modulo !== TODOS);
}

export function modulosForArea(index: Map<string, string[]>, area: string): string[] {
  return collectModulosForArea(index.entries(), area);
}

function parseJsonValue(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

/** Normaliza `areas_por_modulo` (jsonb/string) para mapa módulo → áreas. */
export function parseAreasPorModulo(raw: unknown): Record<string, string[]> {
  let parsed: unknown = raw;
  if (typeof parsed === "string") {
    parsed = parseJsonValue(parsed);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {};
  }

  const result: Record<string, string[]> = {};
  for (const [modulo, areasRaw] of Object.entries(parsed as Record<string, unknown>)) {
    const moduloKey = String(modulo).trim();
    if (!moduloKey) continue;

    let areasValue: unknown = areasRaw;
    if (typeof areasValue === "string") {
      areasValue = parseJsonValue(areasValue);
    }
    if (!Array.isArray(areasValue)) continue;

    const areas = areasValue
      .map((area) => String(area).trim())
      .filter((area) => area.length > 0);
    if (areas.length > 0) result[moduloKey] = areas;
  }

  return result;
}

/** Converte mapa módulo → áreas em pares para compatibilidade com helpers legados. */
export function moduloAreaPairsFromAreasPorModulo(
  areasPorModulo: unknown,
): ModuloAreaPair[] {
  const map =
    areasPorModulo &&
    typeof areasPorModulo === "object" &&
    !Array.isArray(areasPorModulo) &&
    !("areas_por_modulo" in (areasPorModulo as object))
      ? (areasPorModulo as Record<string, string[]>)
      : parseAreasPorModulo(areasPorModulo);

  const pairs: ModuloAreaPair[] = [];
  for (const [modulo, areas] of Object.entries(map)) {
    for (const area of areas) {
      pairs.push({ modulo, area });
    }
  }
  return pairs;
}

/** Áreas de um módulo a partir do mapa `areas_por_modulo`. */
export function areasForModuloFromMap(
  map: Record<string, string[]>,
  modulo: string,
): string[] {
  return lookupAreasByModulo((key) => map[key], Object.keys(map), modulo, true);
}

/** Resolve áreas do módulo: mapa jsonb → índice de pares (fallback). */
export function resolveAreasForModulo(
  areasPorModulo: Record<string, string[]>,
  pairs: ModuloAreaPair[],
  modulo: string,
): string[] {
  const fromMap = areasForModuloFromMap(areasPorModulo, modulo);
  if (fromMap.length > 0) return fromMap;
  return areasForModulo(buildModuloAreaIndex(pairs), modulo);
}

/** Resolve módulos da área: mapa jsonb → índice de pares (fallback). */
export function resolveModulosForArea(
  areasPorModulo: Record<string, string[]>,
  pairs: ModuloAreaPair[],
  area: string,
): string[] {
  const fromMap = collectModulosForArea(Object.entries(areasPorModulo), area);
  if (fromMap.length > 0) return fromMap;
  return modulosForArea(buildModuloAreaIndex(pairs), area);
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
