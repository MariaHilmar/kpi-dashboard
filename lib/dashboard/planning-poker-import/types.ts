export type PlanningPokerRow = {
  issue_key: string;
  gitlab_repo: string;
  gitlab_iid: number;
  sprint?: string | null;
  story_points?: number | null;
  aceita?: string | null;
  justificada?: string | null;
  historico?: string | null;
  recorrente?: string | null;
  horas_estimada?: number | null;
  horas_prevista?: number | null;
  homologado?: string | null;
  ultimo_comentario?: string | null;
};

export type PlanningPokerImportStats = {
  processed: number;
  upserted_issues: number;
  not_found_in_issues: number;
  upserted_milestone_issues: number;
  errors: number;
  warnings: string[];
};
