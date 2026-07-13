import { MilestoneCapacityPanel } from "@/components/dashboard/milestone/MilestoneCapacityPanel";
import { MilestoneSectionNotice } from "@/components/dashboard/milestone/MilestoneSectionNotice";
import { readSearchParam } from "@/lib/dashboard/search-params";
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
    readSearchParam(fromRaw),
    readSearchParam(toRaw),
    anchorIid,
  );

  if (!range) {
    return (
      <MilestoneSectionNotice>
        Importe milestones do GitLab para visualizar capacidade por equipe.
      </MilestoneSectionNotice>
    );
  }

  const metric = parseMilestoneCapacityMetric(readSearchParam(metricRaw));
  const [rows, filterOptions] = await Promise.all([
    fetchMilestoneCapacityByTeam(range.fromIid, range.toIid),
    fetchFilterOptions(),
  ]);
  const dataTeams = milestoneCapacityUniqueTeams(rows);
  const teamOptions = milestoneCapacityTeamOptions(filterOptions.equipes, dataTeams);
  const selectedTeam = parseMilestoneCapacityTeam(readSearchParam(teamRaw), teamOptions);
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
