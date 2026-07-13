import type { MilestoneUrlPatch } from "@/hooks/useMilestoneUrlParams";
import {
  MILESTONE_ROADMAP_GROUP_LABELS,
  MILESTONE_ROADMAP_TOP_N_OPTIONS,
  type MilestoneRoadmapGroupBy,
  type MilestoneRoadmapMetric,
  type MilestoneRoadmapRow,
} from "@/lib/dashboard/milestone-roadmap";
import { milestoneIidsDesc, type MilestoneOption } from "@/lib/dashboard/milestone-options";

import { roadmapLabelOptions } from "@/components/dashboard/milestone/roadmap/roadmap-utils";

type RoadmapFiltersProps = {
  milestones: MilestoneOption[];
  fromIid: number;
  toIid: number;
  groupBy: MilestoneRoadmapGroupBy;
  metric: MilestoneRoadmapMetric;
  topN: number;
  selectedLabel: string | null;
  rows: MilestoneRoadmapRow[];
  onParamsChange: (patch: MilestoneUrlPatch) => void;
};

export function RoadmapFilters({
  milestones,
  fromIid,
  toIid,
  groupBy,
  metric,
  topN,
  selectedLabel,
  rows,
  onParamsChange,
}: Readonly<RoadmapFiltersProps>) {
  const groupLabel = MILESTONE_ROADMAP_GROUP_LABELS[groupBy];
  const iidOptions = milestoneIidsDesc(milestones);
  const labelOptions = roadmapLabelOptions(rows);

  return (
    <div className="mb-4 flex flex-wrap items-end gap-4">
      <label className="flex flex-col gap-1 text-xs">
        <span className="font-medium text-slate-600">De (sprint)</span>
        <select
          aria-label="Sprint inicial"
          value={String(fromIid)}
          onChange={(event) => onParamsChange({ from: event.target.value })}
          className="min-w-[6rem] rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
        >
          {iidOptions.map((iid) => (
            <option key={iid} value={iid}>
              {iid}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs">
        <span className="font-medium text-slate-600">Até (sprint)</span>
        <select
          aria-label="Sprint final"
          value={String(toIid)}
          onChange={(event) => onParamsChange({ to: event.target.value })}
          className="min-w-[6rem] rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
        >
          {iidOptions.map((iid) => (
            <option key={iid} value={iid}>
              {iid}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs">
        <span className="font-medium text-slate-600">Agrupar por</span>
        <select
          aria-label="Agrupamento do roadmap"
          value={groupBy}
          onChange={(event) =>
            onParamsChange({
              roadmapGroup: event.target.value,
              roadmapLabel: null,
            })
          }
          className="min-w-[8rem] rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
        >
          <option value="modulo">Módulo</option>
          <option value="epico">Épico</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs">
        <span className="font-medium text-slate-600">Top por sprint</span>
        <select
          aria-label="Quantidade por célula"
          value={String(topN)}
          onChange={(event) => onParamsChange({ roadmapTopN: event.target.value })}
          className="min-w-[5rem] rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
        >
          {MILESTONE_ROADMAP_TOP_N_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs">
        <span className="font-medium text-slate-600">Métrica</span>
        <select
          aria-label="Métrica do roadmap"
          value={metric}
          onChange={(event) =>
            onParamsChange({ roadmapMetric: event.target.value as MilestoneRoadmapMetric })
          }
          className="min-w-[8rem] rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
        >
          <option value="pontos">Story points</option>
          <option value="issues">Issues</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs">
        <span className="font-medium text-slate-600">{groupLabel} (série)</span>
        <select
          aria-label={`${groupLabel} para gráfico de linha`}
          value={selectedLabel ?? ""}
          onChange={(event) => onParamsChange({ roadmapLabel: event.target.value || null })}
          className="min-w-[10rem] rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
        >
          {labelOptions.length === 0 ? (
            <option value="">Nenhum registro</option>
          ) : (
            labelOptions.map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))
          )}
        </select>
      </label>
    </div>
  );
}
