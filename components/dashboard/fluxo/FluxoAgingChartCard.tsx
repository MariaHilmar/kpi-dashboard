"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { FlowAgingChartPoint } from "@/lib/dashboard/flow-charts";
import { issueKeyToIid } from "@/lib/dashboard/gitlab-url";
import { formatDecimal, formatNumber } from "@/lib/format";

type FluxoAgingChartCardProps = {
  title: string;
  subtitle?: string;
  data: FlowAgingChartPoint[];
  leadTimeReferencia: number | null;
};

const COLOR_NORMAL = "#2563eb";
const COLOR_CRITICA = "#ea580c";
const COLOR_REFERENCIA = "#64748b";

export function FluxoAgingChartCard({
  title,
  subtitle,
  data,
  leadTimeReferencia,
}: Readonly<FluxoAgingChartCardProps>) {
  const hasReferenceLine = leadTimeReferencia !== null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
        {hasReferenceLine ? (
          <p className="mt-1 text-xs text-slate-500">
            Linha tracejada = mediana do lead time no período ({formatDecimal(leadTimeReferencia)} dias).
            Barras laranja ultrapassam essa referência.
          </p>
        ) : null}
      </div>

      {data.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500">
          Nenhuma issue em andamento no recorte.
        </div>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="label"
                width={72}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                formatter={(value) => [`${value} dias`, "Idade"]}
                labelFormatter={(_, payload) => {
                  const row = payload?.[0]?.payload as FlowAgingChartPoint | undefined;
                  if (!row) return "";
                  return `${issueKeyToIid(row.issueKey)} · ${row.etapa}`;
                }}
              />
              {hasReferenceLine ? (
                <ReferenceLine
                  x={leadTimeReferencia}
                  stroke={COLOR_REFERENCIA}
                  strokeDasharray="4 4"
                  label={{
                    value: "LT mediana",
                    position: "insideTopRight",
                    fill: COLOR_REFERENCIA,
                    fontSize: 11,
                  }}
                />
              ) : null}
              <Bar dataKey="dias" name="Dias" radius={[0, 4, 4, 0]}>
                {data.map((entry) => (
                  <Cell
                    key={entry.issueKey}
                    fill={entry.critica ? COLOR_CRITICA : COLOR_NORMAL}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {data.length > 0 ? (
        <p className="mt-3 text-xs text-slate-500">
          {formatNumber(data.filter((row) => row.critica).length)} de{" "}
          {formatNumber(data.length)} acima da mediana do lead time de referência.
        </p>
      ) : null}
    </section>
  );
}
