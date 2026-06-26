/**
 * Formatação centralizada (locale pt-BR).
 *
 * Mantém uma única fonte de verdade para como números, datas e percentuais
 * são exibidos no dashboard, evitando helpers duplicados espalhados pelos
 * componentes. O placeholder padrão para valores ausentes é o travessão.
 */

const LOCALE = "pt-BR";

export const EMPTY_PLACEHOLDER = "—";

function isMissing(value: unknown): boolean {
  return value === null || value === undefined || Number.isNaN(Number(value));
}

/** Inteiro/locale (ex.: 1000 -> "1.000"). Ausente -> "—". */
export function formatNumber(value: number | null | undefined): string {
  if (isMissing(value)) return EMPTY_PLACEHOLDER;
  return Number(value).toLocaleString(LOCALE);
}

/** Decimal com até N casas (ex.: 12.5 -> "12,5"). Ausente -> "—". */
export function formatDecimal(
  value: number | null | undefined,
  maximumFractionDigits = 1,
): string {
  if (isMissing(value)) return EMPTY_PLACEHOLDER;
  return Number(value).toLocaleString(LOCALE, { maximumFractionDigits });
}

/** Percentual locale com 1 casa fixa (ex.: 60 -> "60,0%"). Usado em KPIs. */
export function formatPercent(value: number | null | undefined): string {
  if (isMissing(value)) return EMPTY_PLACEHOLDER;
  return `${Number(value).toLocaleString(LOCALE, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

/** Percentual fixo com ponto (ex.: 33.333 -> "33.3%"). Usado em tabelas. */
export function formatPercentFixed(value: number | null | undefined): string {
  if (isMissing(value)) return EMPTY_PLACEHOLDER;
  return `${Number(value).toFixed(1)}%`;
}

/** Data curta (ex.: "15/06/2024"). Vazio/ inválido -> "—". */
export function formatDate(value: string | null | undefined): string {
  if (!value) return EMPTY_PLACEHOLDER;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return EMPTY_PLACEHOLDER;
  return date.toLocaleDateString(LOCALE);
}

/** Data e hora (ex.: "15/06/2024 14:30"). Vazio/ inválido -> "—". */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return EMPTY_PLACEHOLDER;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return EMPTY_PLACEHOLDER;
  return date.toLocaleString(LOCALE);
}
