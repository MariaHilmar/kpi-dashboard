"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ChartPoint } from "@/types/database";

type BarChartCardProps = {
  title: string;
  subtitle?: string;
  data: ChartPoint[];
  horizontal?: boolean;
  emptyMessage?: string;
};

export function BarChartCard({
  title,
  subtitle,
  data,
  horizontal = false,
  emptyMessage = "Sem dados para exibir.",
}: BarChartCardProps) {
  const chartData = data.map((item) => ({
    name: item.label,
    issues: item.quantidade,
  }));

  const longestLabel = chartData.reduce((max, item) => Math.max(max, item.name.length), 0);
  const yAxisWidth = horizontal ? Math.min(220, Math.max(120, longestLabel * 7)) : undefined;
  const horizontalHeight = Math.max(288, chartData.length * 32 + 56);
  const chartHeight = horizontal ? horizontalHeight : 288;
  const leftMargin = horizontal ? yAxisWidth! + 12 : 8;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
      </div>

      {chartData.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500">
          {emptyMessage}
        </div>
      ) : (
        <div style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout={horizontal ? "vertical" : "horizontal"}
              margin={{ top: 8, right: 16, left: leftMargin, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={!horizontal} horizontal={horizontal} />
              {horizontal ? (
                <>
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={yAxisWidth}
                    interval={0}
                    tick={{ fontSize: 12 }}
                  />
                </>
              ) : (
                <>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis allowDecimals={false} />
                </>
              )}
              <Tooltip
                formatter={(value) => [`${value}`, "Issues"]}
                labelFormatter={(label) => String(label)}
              />
              <Bar dataKey="issues" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
