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
import type { TooltipContentProps } from "recharts";

import type { CfdChartPoint } from "@/lib/dashboard/flow-charts";
import { CardSectionHeader } from "@/components/dashboard/CardSectionHeader";
import {
  FLOW_CFD_ETAPAS,
  getFlowCfdFillOpacity,
  getFlowEtapaChartColor,
  orderCfdEtapasForDisplay,
  orderCfdEtapasForStack,
  type FlowEtapa,
} from "@/lib/dashboard/flow-stages";
import { formatDate } from "@/lib/format";

type CfdChartCardProps = {
  title: string;
  subtitle?: string;
  titleTooltip?: string;
  data: CfdChartPoint[];
};

type CfdTooltipProps = Pick<TooltipContentProps, "active" | "label" | "payload"> & {
  displayEtapas: FlowEtapa[];
};

function CfdTooltipContent({ active, payload, label, displayEtapas }: CfdTooltipProps) {
  if (!active || !payload?.length) return null;

  const payloadByName = new Map(payload.map((entry) => [String(entry.name), entry]));

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="mb-2 font-medium text-slate-900">{formatDate(String(label))}</p>
      <ul className="space-y-1">
        {displayEtapas.map((etapa) => {
          const entry = payloadByName.get(etapa);
          if (!entry) return null;

          const color = getFlowEtapaChartColor(etapa);

          return (
            <li key={etapa} className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span style={{ color }}>
                {etapa} : {entry.value}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CfdLegendContent({ displayEtapas }: { displayEtapas: FlowEtapa[] }) {
  return (
    <ul className="m-0 flex list-none flex-wrap justify-center gap-x-4 gap-y-1 p-0 pt-2">
      {displayEtapas.map((etapa) => {
        const color = getFlowEtapaChartColor(etapa);

        return (
          <li key={etapa} className="inline-flex items-center gap-1.5 text-sm">
            <span
              className="inline-block h-3.5 w-3.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span style={{ color }}>{etapa}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function CfdChartCard({ title, subtitle, titleTooltip, data }: CfdChartCardProps) {
  const visibleEtapas = FLOW_CFD_ETAPAS.filter((etapa) =>
    data.some((point) => Number(point[etapa] ?? 0) > 0),
  );
  const stackEtapas = orderCfdEtapasForStack(
    visibleEtapas.length > 0 ? visibleEtapas : [...FLOW_CFD_ETAPAS],
  );
  const displayEtapas = orderCfdEtapasForDisplay(stackEtapas);

  return (
    <section className="overflow-visible rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <CardSectionHeader title={title} subtitle={subtitle} tooltip={titleTooltip} />

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
                content={(props) => (
                  <CfdTooltipContent {...props} displayEtapas={displayEtapas} />
                )}
              />
              <Legend content={() => <CfdLegendContent displayEtapas={displayEtapas} />} />
              {stackEtapas.map((etapa) => (
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
