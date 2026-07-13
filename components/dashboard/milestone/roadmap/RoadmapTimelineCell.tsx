import { IssueCountLink } from "@/components/dashboard/IssueCountLink";
import { buildMilestoneRoadmapIssuesHref } from "@/lib/dashboard/issuesLinks";
import {
  milestoneRoadmapBarIntensity,
  type MilestoneRoadmapGroupBy,
  type MilestoneRoadmapMetric,
  type MilestoneRoadmapSprintCell,
} from "@/lib/dashboard/milestone-roadmap";
import { formatNumber } from "@/lib/format";

type RoadmapTimelineCellProps = {
  milestoneIid: number;
  milestoneTitulo: string;
  startDate: string | null;
  dueDate: string | null;
  groupBy: MilestoneRoadmapGroupBy;
  metric: MilestoneRoadmapMetric;
  maxValue: number;
  items: MilestoneRoadmapSprintCell["items"];
  onSelectLabel: (label: string) => void;
  selectedLabel: string | null;
};

export function RoadmapTimelineCell({
  milestoneIid,
  milestoneTitulo,
  startDate,
  dueDate,
  groupBy,
  metric,
  maxValue,
  items,
  onSelectLabel,
  selectedLabel,
}: Readonly<RoadmapTimelineCellProps>) {
  const milestoneContext = {
    titulo: milestoneTitulo,
    start_date: startDate,
    due_date: dueDate,
  };

  if (items.length === 0) {
    return (
      <div className="flex h-full min-h-[7rem] items-center justify-center text-xs text-slate-400">
        —
      </div>
    );
  }

  return (
    <ul className="flex min-h-[7rem] flex-col gap-1.5">
      {items.map((item) => {
        const intensity = milestoneRoadmapBarIntensity(item.value, maxValue);
        const href = buildMilestoneRoadmapIssuesHref(milestoneContext, groupBy, item.label);
        const isSelected = selectedLabel === item.label;

        return (
          <li key={`${milestoneIid}-${item.label}`}>
            <button
              type="button"
              onClick={() => onSelectLabel(item.label)}
              className={`w-full rounded-md border px-2 py-1.5 text-left transition-colors ${
                isSelected
                  ? "border-govbr-blue bg-blue-50"
                  : "border-slate-100 bg-slate-50 hover:border-slate-200 hover:bg-white"
              }`}
              title={`${item.label}\n${formatNumber(item.entregues)} issues · ${formatNumber(item.pontos_entregues)} pontos`}
            >
              <div className="mb-1 flex items-start justify-between gap-1">
                <span
                  className={`line-clamp-2 text-[11px] font-medium leading-tight ${
                    isSelected ? "text-govbr-blue" : "text-slate-800"
                  }`}
                >
                  {item.label}
                </span>
                <span className="shrink-0 text-[10px] text-slate-500">#{item.rank}</span>
              </div>
              <div
                className="mb-1 h-1.5 overflow-hidden rounded-full bg-slate-200"
                aria-hidden="true"
              >
                <span
                  className="block h-full rounded-full bg-emerald-500"
                  style={{ width: `${Math.max(intensity * 100, item.value > 0 ? 8 : 0)}%` }}
                />
              </div>
              <div className="flex items-center justify-between gap-1 text-[10px] text-slate-600">
                <span>
                  {metric === "issues"
                    ? `${formatNumber(item.entregues)} iss.`
                    : `${formatNumber(item.pontos_entregues)} pts`}
                </span>
                {href ? (
                  <IssueCountLink
                    count={item.entregues}
                    href={href}
                    label={`${item.label} — sprint ${milestoneIid}`}
                  >
                    <span className="text-govbr-blue hover:underline">ver</span>
                  </IssueCountLink>
                ) : null}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
