import { NAO_INFORMADO, TODOS } from "@/lib/dashboard/constants";
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
  ano: null,
  criadoDe: null,
  criadoAte: null,
  fechadoDe: null,
  fechadoAte: null,
};

function strOr(value: string | string[] | undefined, fallback: string = TODOS): string {
  if (typeof value !== "string" || value === "") return fallback;
  return value;
}

function dateOr(value: string | string[] | undefined): string | null {
  if (typeof value !== "string" || value === "") return null;
  return value;
}

export function parseFilters(
  searchParams: Record<string, string | string[] | undefined>,
): DashboardFilters {
  const anoRaw = typeof searchParams.ano === "string" ? searchParams.ano : "";
  const ano = anoRaw && anoRaw !== TODOS ? Number(anoRaw) : null;

  return {
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
    criadoDe: dateOr(searchParams.criadoDe),
    criadoAte: dateOr(searchParams.criadoAte),
    fechadoDe: dateOr(searchParams.fechadoDe),
    fechadoAte: dateOr(searchParams.fechadoAte),
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
  };
}

export function filtersToSearchParams(
  filters: Partial<DashboardFilters> | null | undefined,
): URLSearchParams {
  const params = new URLSearchParams();
  if (!filters) return params;
  for (const [key, value] of Object.entries(filters)) {
    if (value === null || value === undefined || value === "" || value === TODOS) continue;
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
