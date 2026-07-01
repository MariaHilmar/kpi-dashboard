export type AnalistaRelatorioStatus = "rascunho" | "publicado";

export type AnalistaRelatorioKpis = {
  total: number;
  abertas: number;
  fechadas: number;
  canceladas: number;
  entregues: number;
  doing: number;
  sprint_atual: string | null;
};

export type AnalistaDistribuicaoRow = {
  label: string;
  total: number;
  abertas: number;
  fechadas: number;
  pct_conclusao: number;
};

export type AnalistaIssueRow = {
  gitlab_iid: number | null;
  gitlab_repo: string | null;
  titulo: string | null;
  modulo: string | null;
  tipo: string | null;
  colaborador: string | null;
  status: string | null;
  status_label: string | null;
  parceiro: string | null;
  epico: string | null;
  sprint: string | null;
  criado_em: string | null;
  url: string | null;
};

export type AnalistaRelatorioSnapshot = {
  kpis: AnalistaRelatorioKpis;
  por_tipo: AnalistaDistribuicaoRow[];
  por_modulo: AnalistaDistribuicaoRow[];
  por_parceiro: AnalistaDistribuicaoRow[];
  issues: AnalistaIssueRow[];
};

export type AnalistaRelatorioSalvo = {
  id: string;
  user_id: string;
  ano_mes: string;
  sprint: string;
  outras_atividades: string | null;
  status: AnalistaRelatorioStatus;
  publicado_em: string | null;
  updated_at: string;
};

export type SaveAnalistaRelatorioInput = {
  anoMes: string;
  sprint?: string;
  outrasAtividades: string;
  status?: AnalistaRelatorioStatus;
};
