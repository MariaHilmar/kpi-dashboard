import { DEFAULT_PERIODO_TIPO, type PeriodoTipo } from "@/lib/dashboard/constants";
import type { DashboardFilters } from "@/types/database";

/** Tooltip do filtro global de período. */
export const PERIODO_FILTER_TOOLTIP =
  "Filtra o recorte por intervalo de datas.\n\nEscolha se a data é de criação, fechamento da issue ou merge do MR no GitLab.\n\nNão afeta Evolução mensal (sempre últimos 6 meses). A tabela Mergeadas por período usa o intervalo informado quando o período global estiver preenchido; caso contrário, mostra os últimos 6 meses do merge.";

/** Evento para abrir o popup do filtro global de período a partir de outras seções. */
export const OPEN_PERIOD_FILTER_EVENT = "mgi:open-period-filter";

/** Solicita abertura do filtro de período (escutado por GlobalFilters). */
export function requestOpenPeriodFilter(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_PERIOD_FILTER_EVENT));
}

/** Sentinela na URL (?periodo=todos) que desliga o default e mostra todo o histórico. */
export const PERIODO_TODOS = "todos";

/** Número de meses do recorte padrão do filtro global de período. */
export const DEFAULT_PERIODO_MESES = 6;

function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Intervalo padrão do filtro global: últimos N meses-calendário até hoje, por data
 * de fechamento. Começa no 1º dia do mês (N-1) meses atrás para abranger exatamente
 * N meses (ex.: N=6 em julho → 01/02 a hoje, 6 colunas mensais no pivô).
 */
export function defaultPeriodRange(today: Date = new Date()): { de: string; ate: string } {
  const ate = new Date(today);
  const de = new Date(today.getFullYear(), today.getMonth() - (DEFAULT_PERIODO_MESES - 1), 1);
  return { de: toISODate(de), ate: toISODate(ate) };
}

export function hasActiveGlobalPeriodFilter(
  filters: Pick<DashboardFilters, "periodoDe" | "periodoAte" | "ano">,
): boolean {
  return Boolean(
    filters.periodoDe || filters.periodoAte || (filters.ano != null && Number.isFinite(filters.ano)),
  );
}

const PERIODO_TIPO_DATA_LABEL: Record<PeriodoTipo, string> = {
  criacao: "data de criação",
  fechamento: "data de fechamento",
  merge: "data de merge",
};

/** Palavra do tipo de data (sem o prefixo "data de"), para o trecho em destaque. */
const PERIODO_TIPO_PALAVRA: Record<PeriodoTipo, string> = {
  criacao: "criação",
  fechamento: "fechamento",
  merge: "merge",
};

/** Prefixo fixo do rótulo de contexto do período. */
const PERIODO_CONTEXT_LEAD = "Dados por data de ";

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

/**
 * Verdadeiro quando o recorte de período aplica janela de fechamento ou merge —
 * o que exclui issues abertas (elas não têm data de fechamento/merge). Nesses
 * casos os painéis de backlog aberto ficam vazios e cabe orientar o usuário a
 * usar "data de criação".
 */
export function periodoExcluiAbertas(
  filters: Pick<DashboardFilters, "periodoTipo" | "periodoDe" | "periodoAte" | "ano">,
): boolean {
  const resolved = resolvePeriodDates(filters);
  return Boolean(
    resolved.fechadoDe || resolved.fechadoAte || resolved.mergeadoDe || resolved.mergeadoAte,
  );
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

/**
 * Partes do rótulo de contexto do período: `lead` (fixo) + `strong` (destaque com
 * o tipo de data e o intervalo selecionado). Ex.: lead "Dados por data de ",
 * strong "fechamento de 27/01/2026 a 27/07/2026".
 */
export function formatPeriodContextLabelParts(
  filters: Pick<DashboardFilters, "periodoTipo" | "periodoDe" | "periodoAte" | "ano">,
): { lead: string; strong: string } | null {
  const resolved = resolvePeriodDates(filters);
  const tipo = filters.periodoTipo ?? DEFAULT_PERIODO_TIPO;
  const palavra = PERIODO_TIPO_PALAVRA[tipo];

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

  let strong: string;
  if (de && ate) {
    strong = `${palavra} de ${formatBrDate(de)} a ${formatBrDate(ate)}`;
  } else if (de) {
    strong = `${palavra} a partir de ${formatBrDate(de)}`;
  } else {
    strong = `${palavra} até ${formatBrDate(ate!)}`;
  }

  return { lead: PERIODO_CONTEXT_LEAD, strong };
}

/** Texto de contexto para a tela (ex.: "Dados por data de fechamento de 01/06/2026 a 30/06/2026"). */
export function formatPeriodContextLabel(
  filters: Pick<DashboardFilters, "periodoTipo" | "periodoDe" | "periodoAte" | "ano">,
): string | null {
  const parts = formatPeriodContextLabelParts(filters);
  return parts ? `${parts.lead}${parts.strong}` : null;
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
