import type { PlanningPokerRow } from "@/lib/dashboard/planning-poker-import/types";

export function utcNowIso(): string {
  return new Date().toISOString();
}

export function issuePatchFromRow(
  row: PlanningPokerRow,
  milestoneIid: number | null,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {
    story_points: row.story_points,
    aceita: row.aceita,
    justificada: row.justificada,
    historico: row.historico,
    recorrente: row.recorrente,
    horas_estimada: row.horas_estimada,
    horas_prevista: row.horas_prevista,
    homologado: row.homologado,
    ultimo_comentario: row.ultimo_comentario,
    report_fields_synced_at: utcNowIso(),
  };

  if (row.sprint) patch.sprint = row.sprint;
  if (milestoneIid != null) patch.milestone_gitlab_id = milestoneIid;

  return Object.fromEntries(Object.entries(patch).filter(([, value]) => value != null));
}

export function milestoneIssueRowFromPlanningPoker(
  row: PlanningPokerRow,
  milestoneUuid: string,
  issueKey: string | null,
): Record<string, unknown> {
  return {
    milestone_id: milestoneUuid,
    issue_key: issueKey ?? row.issue_key,
    gitlab_repo: row.gitlab_repo,
    gitlab_iid: row.gitlab_iid,
    story_points: row.story_points,
    aceita: row.aceita,
    justificada: row.justificada,
    historico: row.historico,
    recorrente: row.recorrente,
    horas_estimada: row.horas_estimada,
    horas_prevista: row.horas_prevista,
    homologado: row.homologado,
    ultimo_comentario: row.ultimo_comentario,
    imported_at: utcNowIso(),
    import_source: "excel_planning_poker",
  };
}
