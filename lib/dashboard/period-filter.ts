import { DEFAULT_PERIODO_TIPO, type PeriodoTipo } from "@/lib/dashboard/constants";
import type { DashboardFilters } from "@/types/database";

/** Tooltip do filtro global de período. */
export const PERIODO_FILTER_TOOLTIP =
  "Filtra o recorte por intervalo de datas.\n\nEscolha se a data é de criação, fechamento da issue ou merge do MR no GitLab.\n\nNão afeta Evolução mensal nem a tabela Mergeadas por período (últimos 6 meses).";

const PERIODO_TIPO_DATA_LABEL: Record<PeriodoTipo, string> = {
  criacao: "data de criação",
  fechamento: "data de fechamento",
  merge: "data de merge",
};

type ResolvedPeriod = {
  ano: number | null;
  criadoDe: string | null;
  criadoAte: string | null;
  fechadoDe: string | null;
  fechadoAte: string | null;
  mergeadoDe: string | null;
  mergeadoAte: string | null;
};

const EMPTY_PERIOD: ResolvedPeriod = {
  ano: null,
  criadoDe: null,
  criadoAte: null,
  fechadoDe: null,
  fechadoAte: null,
  mergeadoDe: null,
  mergeadoAte: null,
};

/** Converte periodoTipo + intervalo (ou ano legado) nos campos de data da RPC. */
export function resolvePeriodDates(
  filters: Pick<DashboardFilters, "periodoTipo" | "periodoDe" | "periodoAte" | "ano">,
): ResolvedPeriod {
  const { periodoDe, periodoAte, periodoTipo, ano } = filters;

  if (periodoDe || periodoAte) {
    const tipo: PeriodoTipo = periodoTipo ?? DEFAULT_PERIODO_TIPO;
    const base = { ...EMPTY_PERIOD };
    if (tipo === "criacao") {
      return { ...base, criadoDe: periodoDe, criadoAte: periodoAte };
    }
    if (tipo === "fechamento") {
      return { ...base, fechadoDe: periodoDe, fechadoAte: periodoAte };
    }
    return { ...base, mergeadoDe: periodoDe, mergeadoAte: periodoAte };
  }

  if (ano != null && Number.isFinite(ano)) {
    return {
      ...EMPTY_PERIOD,
      criadoDe: `${ano}-01-01`,
      criadoAte: `${ano}-12-31`,
    };
  }

  return EMPTY_PERIOD;
}

export function formatPeriodSummary(
  filters: Pick<DashboardFilters, "periodoTipo" | "periodoDe" | "periodoAte" | "ano">,
  tipoLabels: Record<PeriodoTipo, string>,
): string {
  const resolved = resolvePeriodDates(filters);
  if (!filters.periodoDe && !filters.periodoAte && filters.ano == null) {
    return "Todos";
  }

  const tipo = filters.periodoTipo ?? DEFAULT_PERIODO_TIPO;
  const de = filters.periodoDe ?? resolved.criadoDe ?? resolved.fechadoDe ?? resolved.mergeadoDe;
  const ate = filters.periodoAte ?? resolved.criadoAte ?? resolved.fechadoAte ?? resolved.mergeadoAte;

  if (de && ate) {
    return `${tipoLabels[tipo]}: ${formatBrDate(de)} – ${formatBrDate(ate)}`;
  }
  if (de) return `${tipoLabels[tipo]}: a partir de ${formatBrDate(de)}`;
  if (ate) return `${tipoLabels[tipo]}: até ${formatBrDate(ate)}`;
  if (filters.ano != null) return `Criação: ${filters.ano}`;
  return "Todos";
}

/** Texto de contexto para a tela (ex.: "Dados por data de fechamento de 01/06/2026 a 30/06/2026"). */
export function formatPeriodContextLabel(
  filters: Pick<DashboardFilters, "periodoTipo" | "periodoDe" | "periodoAte" | "ano">,
): string | null {
  const resolved = resolvePeriodDates(filters);
  const tipo = filters.periodoTipo ?? DEFAULT_PERIODO_TIPO;
  const dataLabel = PERIODO_TIPO_DATA_LABEL[tipo];

  const de =
    tipo === "criacao"
      ? resolved.criadoDe
      : tipo === "fechamento"
        ? resolved.fechadoDe
        : resolved.mergeadoDe;
  const ate =
    tipo === "criacao"
      ? resolved.criadoAte
      : tipo === "fechamento"
        ? resolved.fechadoAte
        : resolved.mergeadoAte;

  if (!de && !ate) return null;

  if (de && ate) {
    return `Dados por ${dataLabel} de ${formatBrDate(de)} a ${formatBrDate(ate)}`;
  }
  if (de) return `Dados por ${dataLabel} a partir de ${formatBrDate(de)}`;
  if (ate) return `Dados por ${dataLabel} até ${formatBrDate(ate)}`;
  return null;
}

/** Rótulo curto para o botão do filtro (telas estreitas). */
export function formatPeriodSummaryShort(
  filters: Pick<DashboardFilters, "periodoTipo" | "periodoDe" | "periodoAte" | "ano">,
  tipoLabels: Record<PeriodoTipo, string>,
): string {
  if (!filters.periodoDe && !filters.periodoAte && filters.ano == null) {
    return "Todos";
  }

  const tipo = filters.periodoTipo ?? DEFAULT_PERIODO_TIPO;
  const label = tipoLabels[tipo];
  const de = filters.periodoDe;
  const ate = filters.periodoAte;

  if (de && ate && de.endsWith("-01-01") && ate.endsWith("-12-31") && de.slice(0, 4) === ate.slice(0, 4)) {
    return `${label} · ${de.slice(0, 4)}`;
  }
  if (de && ate) {
    return `${label} · ${formatBrDate(de)} – ${formatBrDate(ate)}`;
  }
  if (de) return `${label} · desde ${formatBrDate(de)}`;
  if (ate) return `${label} · até ${formatBrDate(ate)}`;
  if (filters.ano != null) return `Criação · ${filters.ano}`;
  return "Todos";
}

function formatBrDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}
