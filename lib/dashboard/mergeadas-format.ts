/** "2024/03" -> "03/2024". Mantém "Não informado" e outros valores livres. */
export function formatPeriodoLabel(periodo: string): string {
  const match = /^(\d{4})[/-](\d{2})$/.exec(periodo.trim());
  if (!match) return periodo;
  return `${match[2]}/${match[1]}`;
}

/**
 * Chaves "YYYY/MM" dos últimos `count` meses a partir de `reference` (default: hoje),
 * em ordem cronológica crescente. Ex.: [..., "2026/06", "2026/07"].
 */
export function lastMonthsKeys(count = 6, reference: Date = new Date()): string[] {
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(reference.getFullYear(), reference.getMonth() - i, 1);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    keys.push(`${d.getFullYear()}/${mm}`);
  }
  return keys;
}
