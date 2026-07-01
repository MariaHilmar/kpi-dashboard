import { filtersToSearchParams } from "@/lib/dashboard/filters";
import { type AlertaDimensao, NAO_INFORMADO, OUTROS, TODOS } from "@/lib/dashboard/constants";
import type { DashboardFilters } from "@/types/database";

type QueryBase = URLSearchParams | string | DashboardFilters;

function toSearchParams(base: QueryBase): URLSearchParams {
  if (base instanceof URLSearchParams) return new URLSearchParams(base.toString());
  if (typeof base === "string") return new URLSearchParams(base);
  return filtersToSearchParams(base);
}

/** Monta URL de /issues preservando filtros globais. */
export function buildIssuesHref(
  base: QueryBase,
  extra?: Record<string, string | null | undefined>,
): string {
  const params = toSearchParams(base);
  params.delete("page");

  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value === null || value === undefined || value === "" || value === TODOS) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
  }

  const query = params.toString();
  return query ? `/issues?${query}` : "/issues";
}

function moduloFromAlertaRow(modulo: string): string | undefined {
  if (modulo === OUTROS) return NAO_INFORMADO;
  return modulo;
}

/** Drill-down: alertas sem épico/parceria agrupados por módulo. */
export function buildAlertasPorModuloIssuesHref(
  base: QueryBase,
  dimensao: AlertaDimensao,
  modulo: string,
): string {
  const extra: Record<string, string> = { estado: "open" };
  const mod = moduloFromAlertaRow(modulo);
  if (mod) extra.modulo = mod;
  if (dimensao === "sem_epico") extra.epico = NAO_INFORMADO;
  else extra.parceria = NAO_INFORMADO;
  return buildIssuesHref(base, extra);
}

/** Drill-down: issues abertas em uma faixa de idade (Alertas). */
export function buildFaixaIdadeIssuesHref(base: QueryBase, faixa: string): string {
  return buildIssuesHref(base, {
    estado: "open",
    faixaIdade: faixa,
  });
}

/** Drill-down: cards de resumo em Alertas. */
export function buildAlertasResumoIssuesHref(
  base: QueryBase,
  tipo: "abertas" | "sem_epico" | "sem_parceria",
): string {
  const extra: Record<string, string> = { estado: "open" };
  if (tipo === "sem_epico") extra.epico = NAO_INFORMADO;
  if (tipo === "sem_parceria") extra.parceria = NAO_INFORMADO;
  return buildIssuesHref(base, extra);
}
