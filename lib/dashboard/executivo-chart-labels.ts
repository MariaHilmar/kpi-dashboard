/** Rótulos de subtítulo dos gráficos da página Executivo. */

export function issuesVolumeSubtitle(by: string, extra?: string): string {
  const base = `Total de issues por ${by}`;
  return extra ? `${base} (${extra})` : base;
}

export function mergeVolumeSubtitle(by: string): string {
  return `Total de merges por ${by} no recorte filtrado`;
}

export const FLUXO_MENSAL_ISSUES_SUBTITLE =
  "Issues: criadas × fechadas × backlog líquido. Merges: linha separada (data do MR no GitLab).";

export const KPI_POR_TIPO_ISSUES_SUBTITLE =
  "Volume, eficiência e lead time das issues no recorte filtrado";

export const KPI_SECTION_SUBTITLE = "Indicadores de issues no recorte filtrado";
