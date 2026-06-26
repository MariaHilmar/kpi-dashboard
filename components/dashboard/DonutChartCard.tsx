"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import type { ChartPoint } from "@/types/database";

type DonutChartCardProps = {
  title: string;
  subtitle?: string;
  data: ChartPoint[];
  emptyMessage?: string;
};

const PALETTE = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#dc2626",
  "#9333ea",
  "#0891b2",
  "#ea580c",
  "#65a30d",
  "#7c3aed",
  "#db2777",
  "#475569",
];

export function DonutChartCard({
  title,
  subtitle,
  data,
  emptyMessage = "Sem dados para exibir.",
}: DonutChartCardProps) {
  const chartData = data
    .filter((item) => item.quantidade > 0)
    .map((item, idx) => ({
      name: item.label,
      value: item.quantidade,
      color: PALETTE[idx % PALETTE.length],
    }));

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
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="85%"
                paddingAngle={2}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value ?? 0}`, "Issues"]} />
              <Legend
                verticalAlign="bottom"
                height={36}
                wrapperStyle={{ fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
