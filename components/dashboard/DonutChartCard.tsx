"use client";



import {

  Cell,

  Legend,

  Pie,

  PieChart,

  ResponsiveContainer,

  Tooltip,

} from "recharts";



import { CardSectionHeader } from "@/components/dashboard/CardSectionHeader";

import { getIssueStatusChartHex } from "@/lib/dashboard/issue-status";

import type { IssuesDrilldownConfig } from "@/components/dashboard/BarChartCard";

import { buildAggregateIssuesHref } from "@/lib/dashboard/issuesLinks";

import type { ChartPoint } from "@/types/database";



type DonutChartColorScheme = "default" | "issue-status";



type DonutChartCardProps = {

  title: string;

  subtitle?: string;

  titleTooltip?: string;

  data: ChartPoint[];

  emptyMessage?: string;

  /** Paleta padronizada do sistema; use `issue-status` no gráfico de status. */

  colorScheme?: DonutChartColorScheme;

  /** Habilita clique nas fatias para abrir /issues filtrado (nova aba). */

  issuesDrilldown?: IssuesDrilldownConfig;

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



export function DonutChartCard({

  title,

  subtitle,

  titleTooltip,

  data,

  emptyMessage = "Sem dados para exibir.",

  colorScheme = "default",

  issuesDrilldown,

}: DonutChartCardProps) {

  const chartData = data

    .filter((item) => item.quantidade > 0)

    .map((item, idx) => ({

      name: item.label,

      value: item.quantidade,

      color:

        colorScheme === "issue-status"

          ? getIssueStatusChartHex(item.label)

          : PALETTE[idx % PALETTE.length],

    }));



  const drilldownHint = issuesDrilldown ? " · clique na fatia para ver issues" : "";



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

                cursor={issuesDrilldown ? "pointer" : undefined}

                onClick={(slice) => {

                  if (!issuesDrilldown) return;

                  const payload = slice as { name?: string; value?: number };

                  openIssuesDrilldown(

                    issuesDrilldown,

                    String(payload.name ?? ""),

                    Number(payload.value ?? 0),

                  );

                }}

              >

                {chartData.map((entry) => (

                  <Cell key={entry.name} fill={entry.color} />

                ))}

              </Pie>

              <Tooltip formatter={(value) => [`${value ?? 0}`, `Issues${drilldownHint}`]} />

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

