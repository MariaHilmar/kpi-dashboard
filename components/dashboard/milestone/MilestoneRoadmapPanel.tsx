"use client";

import { useMilestoneUrlParams } from "@/hooks/useMilestoneUrlParams";

import { CardSectionHeader } from "@/components/dashboard/CardSectionHeader";
import { RoadmapAntiPunitiveNotice } from "@/components/dashboard/milestone/roadmap/RoadmapAntiPunitiveNotice";
import { RoadmapFilters } from "@/components/dashboard/milestone/roadmap/RoadmapFilters";
import { RoadmapStoryPointsWarning } from "@/components/dashboard/milestone/roadmap/RoadmapStoryPointsWarning";
import { RoadmapTimeline } from "@/components/dashboard/milestone/roadmap/RoadmapTimeline";
import { RoadmapTrendChart } from "@/components/dashboard/milestone/roadmap/RoadmapTrendChart";
import {
  buildSprintDatesMap,
  getRoadmapMetricLabel,
} from "@/components/dashboard/milestone/roadmap/roadmap-utils";
import type { MilestoneRoadmapPanelProps } from "@/components/dashboard/milestone/roadmap/types";
import {
  MILESTONE_ROADMAP_GROUP_LABELS,
  milestoneRoadmapToLineSeries,
  milestoneRoadmapToTimeline,
} from "@/lib/dashboard/milestone-roadmap";

export type { MilestoneRoadmapPanelProps } from "@/components/dashboard/milestone/roadmap/types";

export function MilestoneRoadmapPanel({
  milestones,
  fromIid,
  toIid,
  groupBy,
  metric,
  topN,
  selectedLabel,
  rows,
  hasStoryPoints,
}: Readonly<MilestoneRoadmapPanelProps>) {
  const { pushParams } = useMilestoneUrlParams();

  const timeline = milestoneRoadmapToTimeline(rows, metric);
  const lineSeries = milestoneRoadmapToLineSeries(rows, selectedLabel, metric);
  const metricLabel = getRoadmapMetricLabel(metric);
  const groupLabel = MILESTONE_ROADMAP_GROUP_LABELS[groupBy];
  const sprintDates = buildSprintDatesMap(rows);

  return (
    <section className="overflow-visible rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <CardSectionHeader
        title="Roadmap por sprint"
        subtitle={`Sprints ${fromIid} → ${toIid} · top ${topN} ${groupLabel.toLowerCase()}s · ${metricLabel.toLowerCase()}`}
        tooltip="Timeline horizontal das entregas por sprint — compare módulos como PNCP e Contratos ao longo do tempo."
      />

      <RoadmapAntiPunitiveNotice />

      <RoadmapFilters
        milestones={milestones}
        fromIid={fromIid}
        toIid={toIid}
        groupBy={groupBy}
        metric={metric}
        topN={topN}
        selectedLabel={selectedLabel}
        rows={rows}
        onParamsChange={pushParams}
      />

      {!hasStoryPoints && metric === "pontos" ? <RoadmapStoryPointsWarning /> : null}

      {timeline.sprints.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500">
          Sem entregas no intervalo selecionado.
        </div>
      ) : (
        <>
          <RoadmapTimeline
            timeline={timeline}
            sprintDates={sprintDates}
            groupBy={groupBy}
            metric={metric}
            selectedLabel={selectedLabel}
            onSelectLabel={(label) => pushParams({ roadmapLabel: label })}
          />

          <RoadmapTrendChart
            lineSeries={lineSeries}
            groupBy={groupBy}
            metric={metric}
            selectedLabel={selectedLabel}
          />
        </>
      )}
    </section>
  );
}
