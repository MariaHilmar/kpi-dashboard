export const TEMPLATE_HEADERS = [
  "gitlab_repo",
  "gitlab_iid",
  "sprint",
  "story_points",
  "aceita",
  "historico_issue",
  "recorrente",
  "horas_estimada",
  "horas prevista",
  "justificada",
  "homologado",
  "historico",
] as const;

export const COLUMN_ALIASES: Record<string, readonly string[]> = {
  gitlab_repo: ["gitlab_repo", "repositorio", "repo"],
  gitlab_iid: ["gitlab_iid", "iid", "id", "issue_id", "#"],
  sprint: ["sprint", "milestone"],
  story_points: ["story_points", "pontos", "peso", "weight", "story points"],
  aceita: ["aceita"],
  justificada: ["justificada"],
  historico: ["historico_issue"],
  recorrente: ["recorrente"],
  horas_estimada: ["horas_estimada", "horas estimada"],
  horas_prevista: ["horas_prevista", "horas prevista"],
  homologado: ["homologado", "homologado?"],
  ultimo_comentario: ["historico"],
};

export const FIBONACCI = new Set([1, 2, 3, 5, 8, 13, 21]);

export const MILESTONE_ISSUE_CHUNK_SIZE = 100;
