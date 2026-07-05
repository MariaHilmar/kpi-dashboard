export type MilestoneOption = {
  id: string;
  gitlab_milestone_iid: number | null;
  titulo: string;
};

/** Milestones GitLab por IID decrescente (sprint mais recente primeiro). */
export function sortMilestoneOptionsDesc(milestones: MilestoneOption[]): MilestoneOption[] {
  return [...milestones].sort(
    (a, b) => (b.gitlab_milestone_iid ?? 0) - (a.gitlab_milestone_iid ?? 0),
  );
}

export function milestoneIidsDesc(milestones: MilestoneOption[]): number[] {
  return sortMilestoneOptionsDesc(milestones)
    .map((m) => m.gitlab_milestone_iid)
    .filter((iid): iid is number => iid != null);
}

/** IID da sprint mais recente importada, ou null se a lista estiver vazia. */
export function resolveLatestMilestoneIid(milestones: MilestoneOption[]): number | null {
  return milestoneIidsDesc(milestones)[0] ?? null;
}

/**
 * Mapeia o rótulo do filtro global `sprint` (issues.sprint) para gitlab_milestone_iid.
 * Ex.: "Sprint 90 - Contratos" → 90 quando existir milestone com esse IID.
 */
export function resolveMilestoneIidForSprintFilter(
  sprintFilter: string,
  milestones: MilestoneOption[],
): number | null {
  if (!sprintFilter || sprintFilter.trim() === "") return null;

  const exact = milestones.find((m) => m.titulo === sprintFilter);
  if (exact?.gitlab_milestone_iid != null) return exact.gitlab_milestone_iid;

  const numberMatch = sprintFilter.match(/(\d+)/);
  if (numberMatch) {
    const iid = Number(numberMatch[1]);
    if (milestones.some((m) => m.gitlab_milestone_iid === iid)) return iid;
  }

  const normalized = sprintFilter.trim().toLowerCase();
  const partial = milestones.find(
    (m) =>
      m.titulo.trim().toLowerCase() === normalized ||
      m.titulo.trim().toLowerCase().includes(normalized),
  );
  return partial?.gitlab_milestone_iid ?? null;
}
