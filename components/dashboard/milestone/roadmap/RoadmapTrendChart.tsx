import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getRoadmapMetricLabel } from "@/components/dashboard/milestone/roadmap/roadmap-utils";
import {
  MILESTONE_ROADMAP_GROUP_LABELS,
  type MilestoneRoadmapGroupBy,
  type MilestoneRoadmapLinePoint,
  type MilestoneRoadmapMetric,
} from "@/lib/dashboard/milestone-roadmap";
import { formatNumber } from "@/lib/format";

type RoadmapTrendChartProps = {
  lineSeries: MilestoneRoadmapLinePoint[];
  groupBy: MilestoneRoadmapGroupBy;
  metric: MilestoneRoadmapMetric;
  selectedLabel: string | null;
};

export function RoadmapTrendChart({
  lineSeries,
  groupBy,
  metric,
  selectedLabel,
}: Readonly<RoadmapTrendChartProps>) {
  const groupLabel = MILESTONE_ROADMAP_GROUP_LABELS[groupBy];
  const metricLabel = getRoadmapMetricLabel(metric);

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-slate-800">
        Tendência{selectedLabel ? `: ${selectedLabel}` : ""}
      </h3>
      {lineSeries.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500">
          Selecione um {groupLabel.toLowerCase()} com entregas no intervalo.
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineSeries} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={60}
              />
              <YAxis allowDecimals={false} />
              <Tooltip
                formatter={(value, _name, item) => {
                  const payload = item.payload as MilestoneRoadmapLinePoint;
                  if (metric === "issues") {
                    return [`${value} issues`, `Sprint ${payload.milestone_iid}`];
                  }
                  return [
                    `${value} pts (${formatNumber(payload.entregues)} issues)`,
                    payload.titulo,
                  ];
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                name={metricLabel}
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
