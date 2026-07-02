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

import type { FlowStageDwellChartPoint, FlowStageDwellMeta } from "@/lib/dashboard/flow-charts";
import { FLOW_REPORT_APPROXIMATIONS } from "@/lib/dashboard/flow-stages";
import { formatDecimal, formatNumber } from "@/lib/format";

type FluxoStageDwellChartCardProps = {
  data: FlowStageDwellChartPoint[];
  meta: FlowStageDwellMeta | null;
  highlightEtapa?: string | null;
};

export function FluxoStageDwellChartCard({
  data,
  meta,
  highlightEtapa,
}: FluxoStageDwellChartCardProps) {
  const longestLabel = data.reduce((max, item) => Math.max(max, item.label.length), 0);
  const yAxisWidth = Math.min(220, Math.max(120, longestLabel * 7));
  const chartHeight = Math.max(288, data.length * 36 + 56);

  const subtitle =
    highlightEtapa != null
      ? `Maior retenção histórica: ${highlightEtapa} · mediana por issue concluída no período`
      : "Mediana de dias por etapa (issues concluídas no período)";

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Tempo por etapa Kanban</h2>
        <p className="text-sm text-slate-500">{subtitle}</p>
        {meta ? (
          <p className="mt-1 text-xs text-slate-500">
            Base: {formatNumber(meta.issuesTotalPeriodo)} issues concluídas no recorte
          </p>
        ) : null}
      </div>

      {data.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500">
          Sem issues concluídas com tempo por etapa no período.
        </div>
      ) : (
        <div style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 8, right: 16, left: yAxisWidth + 12, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal />
              <XAxis type="number" allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="label"
                width={yAxisWidth}
                interval={0}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value, _name, item) => {
                  const point = item.payload as FlowStageDwellChartPoint;
                  return [
                    `${formatDecimal(Number(value))} dias (mediana) · média ${formatDecimal(point.media)} · ${formatNumber(point.quantidadeIssues)} issues`,
                    point.label,
                  ];
                }}
              />
              <Bar
                dataKey="mediana"
                name="Mediana (dias)"
                fill="#1351B4"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {meta && meta.issuesComProxy > 0 ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {formatNumber(meta.issuesComProxy)} de {formatNumber(meta.issuesTotalPeriodo)} issues
          usam aproximação (sem histórico completo no GitLab):{" "}
          {FLOW_REPORT_APPROXIMATIONS.stageDwell}
        </p>
      ) : null}
    </section>
  );
}
