"use client";

import {
  Area,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  AreaChart,
} from "recharts";

import type { CfdChartPoint } from "@/lib/dashboard/flow-charts";
import {
  FLOW_CFD_ETAPAS,
  getFlowCfdFillOpacity,
  getFlowEtapaChartColor,
} from "@/lib/dashboard/flow-stages";
import { formatDate } from "@/lib/format";

type CfdChartCardProps = {
  title: string;
  subtitle?: string;
  data: CfdChartPoint[];
};

export function CfdChartCard({ title, subtitle, data }: CfdChartCardProps) {
  const visibleEtapas = FLOW_CFD_ETAPAS.filter((etapa) =>
    data.some((point) => Number(point[etapa] ?? 0) > 0),
  );

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
      </div>

      {data.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500">
          Sem dados para o período selecionado.
        </div>
      ) : (
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="data"
                tick={{ fontSize: 11 }}
                interval={Math.ceil(data.length / 12)}
                tickFormatter={(value) => formatDate(String(value))}
              />
              <YAxis allowDecimals={false} />
              <Tooltip
                labelFormatter={(value) => formatDate(String(value))}
                formatter={(value, name) => [value, String(name)]}
              />
              <Legend />
              {(visibleEtapas.length > 0 ? visibleEtapas : [...FLOW_CFD_ETAPAS]).map((etapa) => (
                <Area
                  key={etapa}
                  type="monotone"
                  dataKey={etapa}
                  name={etapa}
                  stackId="cfd"
                  stroke={getFlowEtapaChartColor(etapa)}
                  fill={getFlowEtapaChartColor(etapa)}
                  fillOpacity={getFlowCfdFillOpacity(etapa)}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
