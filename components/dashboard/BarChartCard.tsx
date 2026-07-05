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



import { CardSectionHeader } from "@/components/dashboard/CardSectionHeader";

import type { AggregateDimension } from "@/lib/dashboard/constants";

import { buildAggregateIssuesHref } from "@/lib/dashboard/issuesLinks";

import type { ChartPoint, DashboardFilters } from "@/types/database";



export type IssuesDrilldownConfig = {

  filters: DashboardFilters;

  dimension: AggregateDimension;

  estado?: "open" | "closed";

};



type BarChartCardProps = {

  title: string;

  subtitle?: string;

  titleTooltip?: string;

  data: ChartPoint[];

  horizontal?: boolean;

  emptyMessage?: string;

  /** Habilita clique nas barras para abrir /issues filtrado (nova aba). */

  issuesDrilldown?: IssuesDrilldownConfig;

};



function openIssuesDrilldown(

  config: IssuesDrilldownConfig,

  label: string,

  quantidade: number,

) {

  if (quantidade <= 0) return;

  const href = buildAggregateIssuesHref(

    config.filters,

    config.dimension,

    label,

    config.estado ? { estado: config.estado } : undefined,

  );

  if (href) {

    window.open(href, "_blank", "noopener,noreferrer");

  }

}



export function BarChartCard({

  title,

  subtitle,

  titleTooltip,

  data,

  horizontal = false,

  emptyMessage = "Sem dados para exibir.",

  issuesDrilldown,

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

  const drilldownHint = issuesDrilldown ? " · clique na barra para ver issues" : "";



  return (

    <section className="overflow-visible rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

      <CardSectionHeader title={title} subtitle={subtitle} tooltip={titleTooltip} />



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

                formatter={(value) => [`${value}`, `Issues${drilldownHint}`]}

                labelFormatter={(label) => String(label)}

              />

              <Bar

                dataKey="issues"

                fill="#2563eb"

                radius={[4, 4, 0, 0]}

                cursor={issuesDrilldown ? "pointer" : undefined}

                onClick={(barData) => {

                  if (!issuesDrilldown) return;

                  const payload = barData as { name?: string; issues?: number; value?: number };

                  openIssuesDrilldown(

                    issuesDrilldown,

                    String(payload.name ?? ""),

                    Number(payload.issues ?? payload.value ?? 0),

                  );

                }}

              />

            </BarChart>

          </ResponsiveContainer>

        </div>

      )}

    </section>

  );

}

