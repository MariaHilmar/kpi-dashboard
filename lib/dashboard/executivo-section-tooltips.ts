/** Textos de tooltip dos títulos da página Executivo (/). */
export const EXECUTIVO_SECTION_TOOLTIPS = {
  page:
    "Visão consolidada das issues GitLab conforme os filtros globais.\n\nReúne indicadores por issue (backlog e fechamento) e por merge (MR mergeado no GitLab).",
  porIssue:
    "KPIs, evolução mensal, distribuição e detalhamento contando issues no recorte filtrado (criação, fechamento e status).",
  porMerge:
    "Tabela dos últimos 6 meses do merge e gráficos por parceria, tipo e prioridade - contagem por data de merge do MR no GitLab.",
  totalIssues:
    "Total de issues GitLab no recorte definido pelos filtros globais.",
  issuesFechadas:
    "Issues com status fechado/concluído no recorte filtrado.",
  issuesAbertas:
    "Issues ainda abertas no recorte filtrado.",
  bugsAbertos:
    "Issues classificadas como bug e ainda abertas no recorte filtrado.",
  melhoriasAbertas:
    "Issues classificadas como melhoria e ainda abertas no recorte filtrado.",
  issuesSemTipo:
    "Issues sem tipo definido (label tipo::*) no recorte filtrado.",
  taxaFechamento:
    "Percentual de issues fechadas sobre o total de issues no recorte filtrado.\n\nIndica a proporção de conclusão do universo analisado.",
  leadTimeMedio:
    "Tempo médio em dias entre a criação e o fechamento das issues concluídas no recorte.\n\nComplementa a visão de velocidade de entrega do portfólio.",
  pctBugsBacklog:
    "Participação de bugs entre todas as issues abertas do recorte.\n\nQuanto maior, maior a pressão corretiva sobre o time.",
  taxaFechBug:
    "Percentual de bugs fechados sobre o total de bugs no universo filtrado.\n\nMede a eficiência de resolução de defeitos.",
  evolucaoMensal:
    "Série mensal de issues criadas, fechadas e backlog líquido.\n\nIgnora os filtros Sprint e Período; respeita os demais filtros globais. A linha de merges conta issues com MR mergeado no GitLab (merged_at), por mês do merge.",
  status:
    "Total de issues no recorte filtrado, agrupadas por status ou coluna Kanban.\n\nMostra onde o volume está concentrado no fluxo.",
  tipo:
    "Total de issues no recorte filtrado, agrupadas por tipo (bug, melhoria, etc.).\n\nPermite enxergar a composição do backlog e das entregas.",
  prioridade:
    "Total de issues no recorte filtrado, agrupadas por prioridade no GitLab.\n\nIdentifica concentração de demandas críticas ou baixas.",
  modulos:
    "Ranking dos módulos ou repositórios com maior volume de issues.\n\nExibe os 14 principais conforme o recorte filtrado.",
  equipes:
    "Ranking das equipes com maior volume de issues no recorte.\n\nExibe os 14 principais grupos de demanda.",
  mergeadasPorPeriodo:
    "Contagem de MRs mergeados no GitLab, distribuída pelo mês do merge.\n\nUse os botões Módulo/Épico para trocar a dimensão das linhas.\n\nOs meses exibidos seguem o filtro global de Período quando ele está preenchido (padrão: últimos 6 meses por fechamento). Ao limpar o período, mostra os últimos 6 meses pela data de merge.",
  mergeadasParceria:
    "Total de merges (MR mergeado no GitLab) no recorte filtrado, agrupados por parceria.\n\nRespeita o período e demais filtros globais. A tabela acima usa sempre os últimos 6 meses do merge.",
  mergeadasTipo:
    "Total de merges no recorte filtrado, agrupados por tipo de issue.\n\nRespeita o período e demais filtros globais.",
  mergeadasPrioridade:
    "Total de merges no recorte filtrado, agrupados por prioridade.\n\nRespeita o período e demais filtros globais.",
  mergeadasPorEpico:
    "Issues com MR mergeado no GitLab distribuídas por épico.\n\nExibe os épicos com maior volume de merges no recorte filtrado.",
} as const;

export const EXECUTIVO_PAGE_SECTIONS = {
  porIssue: {
    title: "Por issue",
    subtitle: "Backlog, fechamento e distribuição no recorte filtrado",
  },
  porMerge: {
    title: "Por merge",
    subtitle:
      "MRs mergeados no GitLab - tabela dos últimos 6 meses e totais no período",
  },
} as const;
