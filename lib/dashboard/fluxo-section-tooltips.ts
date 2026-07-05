/** Textos de tooltip dos títulos da página /fluxo (parágrafos separados por linha em branco). */
export const FLUXO_SECTION_TOOLTIPS = {
  page:
    "Painel de métricas de fluxo Kanban reconstruído a partir do histórico de status no GitLab.\n\nInclui resumo executivo, CFD, throughput, lead time, WIP e gargalos.",
  filtros:
    "Recorte temporal, responsável e granularidade aplicados a todos os blocos desta página.\n\nA granularidade afeta throughput e lead time (semanal ou mensal).",
  resumoExecutivo:
    "Visão consolidada dos principais indicadores do fluxo no período filtrado.\n\nCompare tendências com o período anterior quando nenhum responsável específico está selecionado.",
  concluidas:
    "Número total de tarefas ou demandas finalizadas no período selecionado.\n\nComparado ao período imediatamente anterior.",
  leadTimeMediana:
    "Tempo decorrido (em dias) desde o início de uma demanda até a entrega final.\n\nA mediana representa o tempo típico, evitando distorções de casos extremos.",
  wip:
    "Quantidade de itens em trabalho no momento, ainda não concluídos.\n\nInclui etapas entre o início e a homologação.",
  throughputSemanal:
    "Volume de trabalho entregue pelo time em média a cada semana.\n\nIndica a capacidade produtiva atual do fluxo.",
  throughputMensal:
    "Volume de trabalho entregue pelo time em média a cada mês.\n\nIndica a capacidade produtiva atual do fluxo.",
  gargalo:
    "Etapa com maior acúmulo de itens e tempo médio de permanência mais elevado.\n\nSinaliza o ponto que limita a velocidade de entrega do time.",
  issueMaisAntiga:
    "Demanda parada há mais tempo no sistema (Backlog).\n\nSem movimentação ou conclusão recente.",
  throughputChartSemanal:
    "Quantidade de issues concluídas em cada semana do período.\n\nBaseado em fechado_em; reflete a taxa de entrega do time.",
  throughputChartMensal:
    "Quantidade de issues concluídas em cada mês do período.\n\nBaseado em fechado_em; reflete a taxa de entrega do time.",
  leadTimeChart:
    "Evolução do lead time das issues fechadas, agrupadas por período de conclusão.\n\nLinhas: média, mediana e percentil 85 (P85).",
  leadTimeDistribuicao:
    "Distribuição estatística do lead time de todas as issues fechadas no recorte.\n\nMediana, P85, P95 e outliers complementam o gráfico temporal.",
  wipPorEtapa:
    "Volume atual de issues em cada etapa de trabalho ativo.\n\nInclui A Fazer, Desenvolvimento, Teste e Homologação (exclui Backlog, Concluído e Cancelado).",
  gargalosPorEtapa:
    "Retenção por etapa com base no snapshot atual do fluxo.\n\nCombina quantidade em WIP com idade média e máxima no fluxo ativo.",
  tempoPorEtapa:
    "Tempo histórico de permanência em cada coluna Kanban.\n\nCalculado nas issues concluídas no período via issue_status_events (diferente dos gargalos atuais).",
  agingChart:
    "Dez issues com maior tempo no fluxo ativo (A Fazer / Desenvolvimento em diante).\n\nBarras laranja ultrapassam a mediana do lead time no período.",
  top10Issues:
    "Lista detalhada das dez issues mais antigas em andamento.\n\nMesma base do aging chart, com título, responsável e início do fluxo.",
  cfd:
    "Evolução diária do volume de issues em cada etapa Kanban.\n\nÁreas empilhadas mostram acúmulo; reconstruído via eventos, snapshots ou proxy.",
} as const;
