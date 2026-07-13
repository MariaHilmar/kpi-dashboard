import { makeIssueKeyFromParts, normalizeGitlabRepoSlug } from "@/lib/dashboard/gitlab-url";
import type { PlanningPokerRow } from "@/lib/dashboard/planning-poker-import/types";
import { parseIntValue, parseNumber, parseText } from "@/lib/dashboard/planning-poker-import/value-parsers";

export function parseMappedRow(
  raw: Record<string, unknown>,
  mapping: Record<string, string>,
): PlanningPokerRow | null {
  const iid = parseIntValue(raw[mapping.gitlab_iid]);
  if (!iid) return null;

  const repoRaw = mapping.gitlab_repo ? raw[mapping.gitlab_repo] : "contratos_v2";
  const slug = normalizeGitlabRepoSlug(String(repoRaw ?? "contratos_v2")) ?? "contratos_v2";

  const row: PlanningPokerRow = {
    issue_key: makeIssueKeyFromParts(slug, iid),
    gitlab_repo: slug,
    gitlab_iid: iid,
  };

  if (mapping.story_points) {
    row.story_points = parseIntValue(raw[mapping.story_points]);
  }
  if (mapping.sprint) {
    row.sprint = parseText(raw[mapping.sprint]);
  }

  for (const field of ["aceita", "justificada", "historico", "recorrente", "homologado"] as const) {
    if (mapping[field]) {
      row[field] = parseText(raw[mapping[field]]);
    }
  }

  for (const field of ["horas_estimada", "horas_prevista"] as const) {
    if (mapping[field]) {
      row[field] = parseNumber(raw[mapping[field]]);
    }
  }

  if (mapping.ultimo_comentario) {
    row.ultimo_comentario = parseText(raw[mapping.ultimo_comentario]);
  }

  return row;
}
