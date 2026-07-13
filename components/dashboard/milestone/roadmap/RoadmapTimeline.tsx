import { RoadmapTimelineCell } from "@/components/dashboard/milestone/roadmap/RoadmapTimelineCell";
import type { SprintDatesMap } from "@/components/dashboard/milestone/roadmap/roadmap-utils";
import {
  MILESTONE_ROADMAP_GROUP_LABELS,
  type MilestoneRoadmapGroupBy,
  type MilestoneRoadmapMetric,
  type MilestoneRoadmapTimeline,
} from "@/lib/dashboard/milestone-roadmap";
import { formatNumber } from "@/lib/format";

type RoadmapTimelineProps = {
  timeline: MilestoneRoadmapTimeline;
  sprintDates: SprintDatesMap;
  groupBy: MilestoneRoadmapGroupBy;
  metric: MilestoneRoadmapMetric;
  selectedLabel: string | null;
  onSelectLabel: (label: string) => void;
};

export function RoadmapTimeline({
  timeline,
  sprintDates,
  groupBy,
  metric,
  selectedLabel,
  onSelectLabel,
}: Readonly<RoadmapTimelineProps>) {
  const groupLabel = MILESTONE_ROADMAP_GROUP_LABELS[groupBy];

  return (
    <div className="mb-6">
      <h3 className="mb-3 text-sm font-semibold text-slate-800">
        Timeline — top {groupLabel.toLowerCase()}s por sprint
      </h3>
      <div className="overflow-x-auto pb-2">
        <div
          className="inline-flex min-w-full gap-3"
          style={{ minWidth: `${Math.max(timeline.sprints.length * 11, 100)}rem` }}
        >
          {timeline.sprints.map((sprint) => {
            const dates = sprintDates.get(sprint.milestone_iid);

            return (
              <div
                key={sprint.milestone_iid}
                className="w-44 shrink-0 rounded-lg border border-slate-200 bg-white p-2 shadow-sm"
              >
                <div className="mb-2 border-b border-slate-100 pb-2 text-center">
                  <p className="text-sm font-semibold text-slate-800">{sprint.label}</p>
                  <p className="line-clamp-2 text-[10px] text-slate-500" title={sprint.titulo}>
                    {sprint.titulo}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    {formatNumber(sprint.cell.totalEntregues)} iss. ·{" "}
                    {formatNumber(sprint.cell.totalPontos)} pts
                  </p>
                </div>
                <RoadmapTimelineCell
                  milestoneIid={sprint.milestone_iid}
                  milestoneTitulo={sprint.titulo}
                  startDate={dates?.start_date ?? null}
                  dueDate={dates?.due_date ?? null}
                  groupBy={groupBy}
                  metric={metric}
                  maxValue={timeline.maxCellValue}
                  items={sprint.cell.items}
                  selectedLabel={selectedLabel}
                  onSelectLabel={onSelectLabel}
                />
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Role horizontalmente para percorrer {timeline.sprints.length} sprints. Clique em um{" "}
        {groupLabel.toLowerCase()} para ver a tendência ao longo do tempo.
      </p>
    </div>
  );
}
