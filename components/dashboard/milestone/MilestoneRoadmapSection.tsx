import { MilestoneRoadmapPanel } from "@/components/dashboard/milestone/MilestoneRoadmapPanel";
import { MilestoneSectionNotice } from "@/components/dashboard/milestone/MilestoneSectionNotice";
import { readSearchParam } from "@/lib/dashboard/search-params";
import {
  milestoneRoadmapHasStoryPoints,
  milestoneRoadmapUniqueLabels,
  parseMilestoneRoadmapGroupBy,
  parseMilestoneRoadmapLabel,
  parseMilestoneRoadmapMetric,
  parseMilestoneRoadmapTopN,
  resolveMilestoneRoadmapRange,
} from "@/lib/dashboard/milestone-roadmap";
import { fetchMilestoneRoadmap } from "@/lib/dashboard/milestone-report";
import type { MilestoneOption } from "@/lib/dashboard/milestones";

type MilestoneRoadmapSectionProps = {
  milestones: MilestoneOption[];
  fromRaw?: string | string[];
  toRaw?: string | string[];
  groupByRaw?: string | string[];
  metricRaw?: string | string[];
  topNRaw?: string | string[];
  labelRaw?: string | string[];
};

export async function MilestoneRoadmapSection({
  milestones,
  fromRaw,
  toRaw,
  groupByRaw,
  metricRaw,
  topNRaw,
  labelRaw,
}: Readonly<MilestoneRoadmapSectionProps>) {
  const range = resolveMilestoneRoadmapRange(
    milestones,
    readSearchParam(fromRaw),
    readSearchParam(toRaw),
  );

  if (!range) {
    return (
      <MilestoneSectionNotice>
        Importe milestones do GitLab para visualizar o roadmap por sprint.
      </MilestoneSectionNotice>
    );
  }

  const groupBy = parseMilestoneRoadmapGroupBy(readSearchParam(groupByRaw));
  const metric = parseMilestoneRoadmapMetric(readSearchParam(metricRaw));
  const topN = parseMilestoneRoadmapTopN(readSearchParam(topNRaw));

  const rows = await fetchMilestoneRoadmap(range.fromIid, range.toIid, groupBy, topN);
  const labels = milestoneRoadmapUniqueLabels(rows);
  const selectedLabel = parseMilestoneRoadmapLabel(readSearchParam(labelRaw), labels);
  const hasStoryPoints = milestoneRoadmapHasStoryPoints(rows);

  return (
    <MilestoneRoadmapPanel
      milestones={milestones}
      fromIid={range.fromIid}
      toIid={range.toIid}
      groupBy={groupBy}
      metric={metric}
      topN={topN}
      selectedLabel={selectedLabel}
      rows={rows}
      hasStoryPoints={hasStoryPoints}
    />
  );
}
