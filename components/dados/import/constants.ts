export const PLANILHA_COLUNAS = [
  {
    coluna: "gitlab_repo",
    descricao: "Repositório da issue no GitLab",
    exemplo: "contratos_v2 ou contratos",
    obrigatoria: true,
  },
  {
    coluna: "gitlab_iid",
    descricao: "Número da issue no GitLab",
    exemplo: "1349 (sem #)",
    obrigatoria: true,
  },
  {
    coluna: "sprint",
    descricao: "Nome da sprint / milestone",
    exemplo: "Sprint 90 - Contratos",
    obrigatoria: false,
  },
  {
    coluna: "story_points",
    descricao: "Pontos definidos no Planning Poker",
    exemplo: "1, 2, 3, 5, 8, 13 ou 21",
    obrigatoria: false,
  },
  {
    coluna: "aceita",
    descricao: "Issue aceita pelo PO / equipe",
    exemplo: "Sim ou Não",
    obrigatoria: false,
  },
  {
    coluna: "historico_issue",
    descricao: "Issue classificada como histórico (Sim/Não)",
    exemplo: "Sim ou Não",
    obrigatoria: false,
  },
  {
    coluna: "recorrente",
    descricao: "Issue recorrente entre sprints",
    exemplo: "Sim ou Não",
    obrigatoria: false,
  },
  {
    coluna: "horas_estimada",
    descricao: "Horas estimadas para a issue",
    exemplo: "8 ou 8,5",
    obrigatoria: false,
  },
  {
    coluna: "horas prevista",
    descricao: "Horas previstas de entrega",
    exemplo: "10 ou 10,5",
    obrigatoria: false,
  },
  {
    coluna: "justificada",
    descricao: "Issue justificada no relatório",
    exemplo: "Sim ou Não",
    obrigatoria: false,
  },
  {
    coluna: "homologado",
    descricao: "Issue homologada pelo PO / cliente",
    exemplo: "Sim ou Não",
    obrigatoria: false,
  },
  {
    coluna: "historico",
    descricao: "Histórico / última observação da issue",
    exemplo: "Aguardando PO",
    obrigatoria: false,
  },
] as const;

export const IMPORT_PASSOS = [
  "Baixe o template Excel ou use sua planilha do Planning Poker.",
  "Preencha repositório e número da issue em cada linha.",
  "Valide a planilha para conferir erros antes de salvar.",
  "Importe para atualizar as issues e, se escolher, o histórico da sprint.",
] as const;
