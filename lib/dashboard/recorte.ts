import { DEFAULT_PERIODO_TIPO, TODOS } from "@/lib/dashboard/constants";
import { formatPeriodContextLabel, resolvePeriodDates } from "@/lib/dashboard/period-filter";
import type { DashboardFilters } from "@/types/database";

/** Filtros globais (fora "período") na ordem de exibição, com rótulo legível. */
const FILTRO_LABELS: { key: keyof DashboardFilters; label: string }[] = [
  { key: "modulo", label: "Módulo" },
  { key: "area", label: "Área funcional" },
  { key: "tipo", label: "Tipo" },
  { key: "prioridade", label: "Prioridade" },
  { key: "equipe", label: "Equipe" },
  { key: "status", label: "Status" },
  { key: "parceria", label: "Parceria" },
  { key: "sprint", label: "Sprint" },
  { key: "epico", label: "Épico" },
  { key: "repositorio", label: "Repositório" },
  { key: "situacao", label: "Situação" },
];

export type RecorteFiltro = { label: string; value: string };

/** Lista só os filtros que não estão em "Todos" (o recorte de fato aplicado). */
export function activeFilterChips(filters: DashboardFilters): RecorteFiltro[] {
  const out: RecorteFiltro[] = [];
  for (const { key, label } of FILTRO_LABELS) {
    const value = filters[key];
    if (typeof value === "string" && value && value !== TODOS) {
      out.push({ label, value });
    }
  }
  return out;
}

/** Rótulo do período para relatórios (ex.: "Dados por data de fechamento de …"). */
export function recortePeriodoLabel(filters: DashboardFilters): string {
  return formatPeriodContextLabel(filters) ?? "Todos os períodos";
}

/** Texto único dos filtros aplicados (para células/parágrafos). */
export function recorteFiltrosTexto(filters: DashboardFilters): string {
  const chips = activeFilterChips(filters);
  if (chips.length === 0) return "Nenhum (todos)";
  return chips.map((c) => `${c.label}: ${c.value}`).join(" · ");
}

/** Slug do recorte para nome de arquivo (ex.: "fechamento_2026-01-27_a_2026-07-27"). */
export function recorteFilenameSlug(filters: DashboardFilters): string {
  const tipo = filters.periodoTipo ?? DEFAULT_PERIODO_TIPO;
  const resolved = resolvePeriodDates(filters);
  const de = resolved.criadoDe ?? resolved.fechadoDe ?? resolved.mergeadoDe;
  const ate = resolved.criadoAte ?? resolved.fechadoAte ?? resolved.mergeadoAte;
  if (de && ate) return `${tipo}_${de}_a_${ate}`;
  if (de) return `${tipo}_desde_${de}`;
  if (ate) return `${tipo}_ate_${ate}`;
  return `todos_${new Date().toISOString().slice(0, 10)}`;
}

/** Resumo estruturado do recorte para montar cabeçalhos das exportações. */
export function recorteResumo(filters: DashboardFilters): {
  periodo: string;
  filtros: RecorteFiltro[];
  filtrosTexto: string;
} {
  return {
    periodo: recortePeriodoLabel(filters),
    filtros: activeFilterChips(filters),
    filtrosTexto: recorteFiltrosTexto(filters),
  };
}
