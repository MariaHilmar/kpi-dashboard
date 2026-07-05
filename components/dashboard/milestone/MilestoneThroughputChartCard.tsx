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
import { LinkButton } from "@/components/ui/Button";

export type MilestoneThroughputChartPoint = {
  periodo: string;
  concluidas: number;
  storyPoints: number;
};

type MilestoneThroughputChartCardProps = {
  title: string;
  subtitle?: string;
  titleTooltip?: string;
  data: MilestoneThroughputChartPoint[];
  fluxoHref: string | null;
  showStoryPoints: boolean;
};

export function MilestoneThroughputChartCard({
  title,
  subtitle,
  titleTooltip,
  data,
  fluxoHref,
  showStoryPoints,
}: Readonly<MilestoneThroughputChartCardProps>) {
  const totalIssues = data.reduce((sum, row) => sum + row.concluidas, 0);
  const totalPoints = data.reduce((sum, row) => sum + row.storyPoints, 0);

  return (
    <section className="overflow-visible rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <CardSectionHeader
          title={title}
          subtitle={subtitle}
          tooltip={titleTooltip}
          className="mb-0"
        />
        {fluxoHref ? (
          <LinkButton href={fluxoHref} variant="outline" size="sm">
            Ver no Fluxo
          </LinkButton>
        ) : null}
      </div>

      {data.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500">
          Nenhuma issue fechada no período da sprint.
        </div>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap gap-4 text-sm text-slate-600">
            <span>
              Total concluídas: <strong className="text-slate-900">{totalIssues}</strong>
            </span>
            {showStoryPoints ? (
              <span>
                Story points: <strong className="text-slate-900">{totalPoints}</strong>
              </span>
            ) : null}
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="periodo"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="concluidas"
                  name="Issues concluídas"
                  fill="#16a34a"
                  radius={[4, 4, 0, 0]}
                />
                {showStoryPoints ? (
                  <Bar
                    dataKey="storyPoints"
                    name="Story points"
                    fill="#2563eb"
                    radius={[4, 4, 0, 0]}
                  />
                ) : null}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </section>
  );
}
