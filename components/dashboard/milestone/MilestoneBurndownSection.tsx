import { MilestoneBurndownPanel } from "@/components/dashboard/milestone/MilestoneBurndownPanel";
import { readSearchParam } from "@/lib/dashboard/search-params";
import {
  buildBurndownSprintCompare,
  computeLastMinuteDeliveryKpi,
  milestoneBurndownHasStoryPoints,
  milestoneBurndownToChartSeries,
  parseMilestoneBurndownGranularity,
  parseMilestoneBurndownMetric,
  resolveBurndownCompareIids,
} from "@/lib/dashboard/milestone-burndown";
import {
  fetchMilestoneBurndown,
  fetchMilestoneDetail,
  type MilestoneDetail,
} from "@/lib/dashboard/milestone-report";

type MilestoneBurndownSectionProps = {
  milestone: MilestoneDetail;
  availableIids: number[];
  burndownMetric?: string | string[];
  burndownGranularity?: string | string[];
};

export async function MilestoneBurndownSection({
  milestone,
  availableIids,
  burndownMetric: burndownMetricRaw,
  burndownGranularity: burndownGranularityRaw,
}: Readonly<MilestoneBurndownSectionProps>) {
  const metric = parseMilestoneBurndownMetric(readSearchParam(burndownMetricRaw));
  const granularity = parseMilestoneBurndownGranularity(readSearchParam(burndownGranularityRaw));

  const compareIids = resolveBurndownCompareIids(milestone.gitlab_milestone_iid, availableIids);
  const compareTargets = [...new Set([milestone.gitlab_milestone_iid, ...compareIids])];

  const loaded = await Promise.all(
    compareTargets.map(async (iid) => {
      const [detail, rows] = await Promise.all([
        iid === milestone.gitlab_milestone_iid
          ? Promise.resolve(milestone)
          : fetchMilestoneDetail(iid),
        fetchMilestoneBurndown(iid),
      ]);
      return { iid, detail, rows };
    }),
  );

  const current = loaded.find((item) => item.iid === milestone.gitlab_milestone_iid);
  const rows = current?.rows ?? [];
  const series = milestoneBurndownToChartSeries(rows, metric, milestone, granularity);
  const kpi = computeLastMinuteDeliveryKpi(
    rows,
    metric,
    milestone.start_date,
    milestone.due_date,
  );
  const hasStoryPoints = milestoneBurndownHasStoryPoints(rows);

  const compareSprints = loaded
    .filter((item) => item.detail != null && compareIids.includes(item.iid))
    .map((item) => buildBurndownSprintCompare(item.iid, item.rows, metric, item.detail!))
    .sort((a, b) => a.milestoneIid - b.milestoneIid);

  return (
    <MilestoneBurndownPanel
      milestoneIid={milestone.gitlab_milestone_iid}
      startDate={milestone.start_date}
      dueDate={milestone.due_date}
      metric={metric}
      granularity={granularity}
      series={series}
      kpi={kpi}
      compareSprints={compareSprints}
      hasStoryPoints={hasStoryPoints}
    />
  );
}
