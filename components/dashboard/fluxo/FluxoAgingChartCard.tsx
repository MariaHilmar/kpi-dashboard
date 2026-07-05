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
import { CardSectionHeader } from "@/components/dashboard/CardSectionHeader";
import { gitlabWorkItemUrlFromIssueKey, issueKeyToIid } from "@/lib/dashboard/gitlab-url";
import { formatDecimal, formatNumber } from "@/lib/format";
import { FLUXO_TOP10_PLOT_HEIGHT } from "@/components/dashboard/fluxo/fluxo-top10-layout";

type FluxoAgingChartCardProps = {
  title: string;
  subtitle?: string;
  titleTooltip?: string;
  data: FlowAgingChartPoint[];
  leadTimeReferencia: number | null;
};

const COLOR_NORMAL = "#2563eb";
const COLOR_CRITICA = "#ea580c";
const COLOR_REFERENCIA = "#64748b";
const COLOR_LINK = "#1351b4";

type AgingYAxisTickProps = {
  x?: number | string;
  y?: number | string;
  payload?: { value?: string };
  rows: FlowAgingChartPoint[];
};

function AgingYAxisTick({ x = 0, y = 0, payload, rows }: Readonly<AgingYAxisTickProps>) {
  const tx = typeof x === "number" ? x : Number(x) || 0;
  const ty = typeof y === "number" ? y : Number(y) || 0;
  const row = rows.find((entry) => entry.label === payload?.value);
  const label = row ? issueKeyToIid(row.issueKey) : payload?.value ?? "";
  const url = row ? gitlabWorkItemUrlFromIssueKey(row.issueKey) : null;

  const textProps = {
    x: 0,
    y: 0,
    dy: 4,
    textAnchor: "end" as const,
    fontSize: 11,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  };

  if (url && row) {
    return (
      <g transform={`translate(${tx},${ty})`}>
        <a href={url} target="_blank" rel="noreferrer" title={row.issueKey}>
          <text {...textProps} fill={COLOR_LINK} style={{ cursor: "pointer" }}>
            {label}
          </text>
        </a>
      </g>
    );
  }

  return (
    <g transform={`translate(${tx},${ty})`}>
      <text {...textProps} fill={COLOR_REFERENCIA}>
        {label}
      </text>
    </g>
  );
}

export function FluxoAgingChartCard({
  title,
  subtitle,
  titleTooltip,
  data,
  leadTimeReferencia,
}: Readonly<FluxoAgingChartCardProps>) {
  const hasReferenceLine = leadTimeReferencia !== null;

  return (
    <section className="overflow-visible rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <CardSectionHeader
        title={title}
        subtitle={
          subtitle || hasReferenceLine ? (
            <>
              {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
              {hasReferenceLine ? (
                <p className="mt-1 text-xs text-slate-500">
                  Linha tracejada = mediana do lead time no período ({formatDecimal(leadTimeReferencia)} dias).
                  Barras laranja ultrapassam essa referência.
                </p>
              ) : null}
            </>
          ) : undefined
        }
        tooltip={titleTooltip}
      />

      {data.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500">
          Nenhuma issue em andamento no recorte.
        </div>
      ) : (
        <div className={FLUXO_TOP10_PLOT_HEIGHT}>
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
                tick={(props) => <AgingYAxisTick {...props} rows={data} />}
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
