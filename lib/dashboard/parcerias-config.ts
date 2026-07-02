import { DEFAULT_FILTERS } from "@/lib/dashboard/filters";
import { TODOS } from "@/lib/dashboard/constants";
import {
  parceriasDefaultOrder,
  resolveParceriasOrder,
} from "@/lib/dashboard/parcerias-sort";
import type { DashboardFilters } from "@/types/database";

export type ParceriasSearchParams = {
  /** Valor de `Parceria::` no GitLab ou `Todos` para listar todas com label. */
  parceiro: string;
  fechadoDe: string;
  fechadoAte: string;
  criadoDe: string | null;
  criadoAte: string | null;
  order: string;
};

function optionalDateParam(value: string | string[] | undefined): string | null {
  if (typeof value !== "string" || value === "") return null;
  return value;
}

function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Intervalo padrão: mês calendário anterior (relatório mensal). */
export function defaultPreviousMonthRange(reference = new Date()): {
  fechadoDe: string;
  fechadoAte: string;
} {
  const firstDay = new Date(reference.getFullYear(), reference.getMonth() - 1, 1);
  const lastDay = new Date(reference.getFullYear(), reference.getMonth(), 0);
  return {
    fechadoDe: formatIsoDate(firstDay),
    fechadoAte: formatIsoDate(lastDay),
  };
}

/** Opções de parceiro vindas do Supabase (`filter_options.parcerias`). */
export function buildParceriasSelectOptions(parcerias: string[]): string[] {
  const seen = new Set<string>();
  const options: string[] = [TODOS];

  for (const value of parcerias) {
    if (!value || value === TODOS || seen.has(value)) continue;
    seen.add(value);
    options.push(value);
  }

  return options;
}

export function resolveParceiroSelection(
  raw: string | null | undefined,
  availableParcerias: string[],
): string {
  const options = buildParceriasSelectOptions(availableParcerias);
  if (!raw || raw === TODOS) return TODOS;
  return options.includes(raw) ? raw : TODOS;
}

export function parseParceriasParams(
  searchParams: Record<string, string | string[] | undefined>,
  availableParcerias: string[],
): ParceriasSearchParams {
  const defaults = defaultPreviousMonthRange();
  const parceiroRaw = typeof searchParams.parceiro === "string" ? searchParams.parceiro : TODOS;
  const fechadoDeRaw =
    typeof searchParams.fechadoDe === "string" && searchParams.fechadoDe !== ""
      ? searchParams.fechadoDe
      : defaults.fechadoDe;
  const fechadoAteRaw =
    typeof searchParams.fechadoAte === "string" && searchParams.fechadoAte !== ""
      ? searchParams.fechadoAte
      : defaults.fechadoAte;

  const parceiro = resolveParceiroSelection(parceiroRaw, availableParcerias);

  return {
    parceiro,
    fechadoDe: fechadoDeRaw,
    fechadoAte: fechadoAteRaw,
    criadoDe: optionalDateParam(searchParams.criadoDe),
    criadoAte: optionalDateParam(searchParams.criadoAte),
    order: resolveParceriasOrder(
      typeof searchParams.order === "string" ? searchParams.order : null,
      parceiro,
    ),
  };
}

export function buildParceriasFilters(params: ParceriasSearchParams): DashboardFilters {
  const { parceiro, fechadoDe, fechadoAte, criadoDe, criadoAte } = params;

  return {
    ...DEFAULT_FILTERS,
    parceria: parceiro,
    fechadoDe,
    fechadoAte,
    criadoDe,
    criadoAte,
  };
}

export function parceriasExigeParceria(params: ParceriasSearchParams): boolean {
  return params.parceiro === TODOS;
}

export function formatParceriaLabel(parceiro: string): string {
  return parceiro === TODOS ? "Todas as parcerias" : parceiro;
}

export function formatParceriasPeriodLabel(fechadoDe: string, fechadoAte: string): string {
  const de = new Date(`${fechadoDe}T12:00:00`);
  const ate = new Date(`${fechadoAte}T12:00:00`);
  const fmt = (value: Date) =>
    value.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  return `${fmt(de)} — ${fmt(ate)}`;
}

export function buildParceriasExportHref(params: ParceriasSearchParams): string {
  const query = new URLSearchParams({
    fechadoDe: params.fechadoDe,
    fechadoAte: params.fechadoAte,
  });
  if (params.parceiro !== TODOS) {
    query.set("parceiro", params.parceiro);
  }
  if (params.criadoDe) query.set("criadoDe", params.criadoDe);
  if (params.criadoAte) query.set("criadoAte", params.criadoAte);
  return `/api/parcerias/export?${query.toString()}`;
}

export function parceriasShowParceriaColumn(parceiro: string): boolean {
  return parceiro === TODOS;
}

export { parceriasDefaultOrder } from "@/lib/dashboard/parcerias-sort";

function slugify(value: string): string {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");

  let start = 0;
  let end = normalized.length;
  while (start < end && normalized[start] === "-") start += 1;
  while (end > start && normalized[end - 1] === "-") end -= 1;
  return normalized.slice(start, end);
}

export function parceriasExportSlug(parceiro: string): string {
  return parceiro === TODOS ? "todas" : slugify(parceiro);
}
