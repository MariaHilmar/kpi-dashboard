/** Textos de tooltip dos títulos da página Detalhamento (/detalhamento). */
export const DETALHAMENTO_SECTION_TOOLTIPS = {
  page:
    "Quebras dimensionais das issues conforme os filtros globais.\n\nPermite analisar volume e lead time por parceria, módulo, área e categoria.",
  parcerias:
    "Volume de issues agrupadas por label de parceria no GitLab.\n\nMostra a distribuição de demandas entre parceiros ou iniciativas.",
  modulos:
    "Ranking dos repositórios ou módulos com maior volume de issues.\n\nExibe os 14 principais conforme o recorte filtrado.",
  areaFuncional:
    "Distribuição por área funcional de negócio.\n\nExibe as 14 áreas com maior concentração de demandas.",
  categoriaFuncional:
    "Classificação por categoria funcional (Core, Compliance, Finance, Platform, Operations).\n\nAjuda a enxergar o perfil estratégico do backlog.",
  leadTimePorModulo:
    "Lead time médio em dias por módulo, nas issues fechadas.\n\nExibe os 15 módulos com maior tempo médio de entrega.",
  kpisPorTipo:
    "Indicadores consolidados por tipo de issue (bug, melhoria, etc.).\n\nInclui volume, taxa de fechamento e lead time médio/mediano.",
} as const;
