/** Textos de tooltip dos títulos da página Qualidade (/qualidade). */
export const QUALIDADE_SECTION_TOOLTIPS = {
  page:
    "Conformidade de cadastro e completude dos metadados das issues.\n\nAvalia tipo, flags de qualidade e backlog aberto por módulo.",
  issuesSemTipo:
    "Issues sem classificação de tipo preenchida ou inferida.\n\nIndica lacunas de cadastro que podem distorcer análises por tipo.",
  pctBugsBacklog:
    "Participação de bugs entre todas as issues abertas do recorte.\n\nQuanto maior, maior a pressão corretiva sobre o time.",
  slaAcima90:
    "Issues abertas há mais de 90 dias.\n\nSinaliza demandas envelhecidas que podem estar fora do SLA esperado.",
  totalFiltrado:
    "Total de issues no recorte conforme os filtros globais.\n\nBase de referência para os indicadores desta página.",
  conformidade:
    "Contagem de issues com resposta \"Sim\" em cada flag de qualidade.\n\nMódulo OK, Área OK, Padrão de Título e Padrão Completo.",
  backlogAbertoModulo:
    "Issues abertas agrupadas por módulo ou repositório.\n\nExibe os 14 módulos com maior volume de backlog ativo.",
} as const;
