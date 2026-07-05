import { MilestoneRoadmapPanel } from "@/components/dashboard/milestone/MilestoneRoadmapPanel";
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

function readParam(value: string | string[] | undefined): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return null;
}

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
    readParam(fromRaw),
    readParam(toRaw),
  );

  if (!range) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Importe milestones do GitLab para visualizar o roadmap por sprint.
      </div>
    );
  }

  const groupBy = parseMilestoneRoadmapGroupBy(readParam(groupByRaw));
  const metric = parseMilestoneRoadmapMetric(readParam(metricRaw));
  const topN = parseMilestoneRoadmapTopN(readParam(topNRaw));

  const rows = await fetchMilestoneRoadmap(range.fromIid, range.toIid, groupBy, topN);
  const labels = milestoneRoadmapUniqueLabels(rows);
  const selectedLabel = parseMilestoneRoadmapLabel(readParam(labelRaw), labels);
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
