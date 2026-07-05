"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CardSectionHeader } from "@/components/dashboard/CardSectionHeader";

type MilestoneMixBarChartCardProps = {
  title: string;
  subtitle?: string;
  titleTooltip?: string;
  data: { label: string; comprometido: number; entregue: number }[];
  emptyMessage?: string;
};

export function MilestoneMixBarChartCard({
  title,
  subtitle,
  titleTooltip,
  data,
  emptyMessage = "Sem dados para exibir.",
}: MilestoneMixBarChartCardProps) {
  const chartData = data.filter((row) => row.comprometido > 0 || row.entregue > 0);

  return (
    <section className="overflow-visible rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <CardSectionHeader title={title} subtitle={subtitle} tooltip={titleTooltip} />

      {chartData.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500">
          {emptyMessage}
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="label"
                width={120}
                tick={{ fontSize: 11 }}
              />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="comprometido"
                name="Comprometido"
                fill="#2563eb"
                radius={[0, 4, 4, 0]}
              />
              <Bar dataKey="entregue" name="Entregue" fill="#16a34a" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
