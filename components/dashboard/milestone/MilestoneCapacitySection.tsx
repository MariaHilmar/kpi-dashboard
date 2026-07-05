import { MilestoneCapacityPanel } from "@/components/dashboard/milestone/MilestoneCapacityPanel";
import {
  milestoneCapacityHasStoryPoints,
  milestoneCapacityTeamOptions,
  milestoneCapacityUniqueTeams,
  parseMilestoneCapacityMetric,
  parseMilestoneCapacityTeam,
  resolveMilestoneCapacityRange,
} from "@/lib/dashboard/milestone-capacity";
import { fetchMilestoneCapacityByTeam } from "@/lib/dashboard/milestone-report";
import { fetchFilterOptions } from "@/lib/dashboard/fetchers";
import type { MilestoneOption } from "@/lib/dashboard/milestones";

type MilestoneCapacitySectionProps = {
  milestones: MilestoneOption[];
  anchorIid?: number | null;
  fromRaw?: string | string[];
  toRaw?: string | string[];
  metricRaw?: string | string[];
  teamRaw?: string | string[];
};

function readParam(value: string | string[] | undefined): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return null;
}

export async function MilestoneCapacitySection({
  milestones,
  anchorIid,
  fromRaw,
  toRaw,
  metricRaw,
  teamRaw,
}: Readonly<MilestoneCapacitySectionProps>) {
  const range = resolveMilestoneCapacityRange(
    milestones,
    readParam(fromRaw),
    readParam(toRaw),
    anchorIid,
  );

  if (!range) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Importe milestones do GitLab para visualizar capacidade por equipe.
      </div>
    );
  }

  const metric = parseMilestoneCapacityMetric(readParam(metricRaw));
  const [rows, filterOptions] = await Promise.all([
    fetchMilestoneCapacityByTeam(range.fromIid, range.toIid),
    fetchFilterOptions(),
  ]);
  const dataTeams = milestoneCapacityUniqueTeams(rows);
  const teamOptions = milestoneCapacityTeamOptions(filterOptions.equipes, dataTeams);
  const selectedTeam = parseMilestoneCapacityTeam(readParam(teamRaw), teamOptions);
  const hasStoryPoints = milestoneCapacityHasStoryPoints(rows);

  return (
    <MilestoneCapacityPanel
      milestones={milestones}
      fromIid={range.fromIid}
      toIid={range.toIid}
      metric={metric}
      selectedTeam={selectedTeam}
      teamOptions={teamOptions}
      rows={rows}
      hasStoryPoints={hasStoryPoints}
    />
  );
}
