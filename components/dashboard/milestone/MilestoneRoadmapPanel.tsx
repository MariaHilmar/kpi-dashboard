"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CardSectionHeader } from "@/components/dashboard/CardSectionHeader";
import { IssueCountLink } from "@/components/dashboard/IssueCountLink";
import { buildMilestoneRoadmapIssuesHref } from "@/lib/dashboard/issuesLinks";
import { milestoneIidsDesc, type MilestoneOption } from "@/lib/dashboard/milestone-options";
import {
  MILESTONE_ROADMAP_ANTI_PUNITIVE_NOTE,
  MILESTONE_ROADMAP_GROUP_LABELS,
  MILESTONE_ROADMAP_TOP_N_OPTIONS,
  milestoneRoadmapBarIntensity,
  milestoneRoadmapToLineSeries,
  milestoneRoadmapToTimeline,
  type MilestoneRoadmapGroupBy,
  type MilestoneRoadmapMetric,
  type MilestoneRoadmapRow,
} from "@/lib/dashboard/milestone-roadmap";
import { formatNumber } from "@/lib/format";

type MilestoneRoadmapPanelProps = {
  milestones: MilestoneOption[];
  fromIid: number;
  toIid: number;
  groupBy: MilestoneRoadmapGroupBy;
  metric: MilestoneRoadmapMetric;
  topN: number;
  selectedLabel: string | null;
  rows: MilestoneRoadmapRow[];
  hasStoryPoints: boolean;
};

function RoadmapTimelineCell({
  milestoneIid,
  milestoneTitulo,
  startDate,
  dueDate,
  groupBy,
  metric,
  maxValue,
  items,
  onSelectLabel,
  selectedLabel,
}: Readonly<{
  milestoneIid: number;
  milestoneTitulo: string;
  startDate: string | null;
  dueDate: string | null;
  groupBy: MilestoneRoadmapGroupBy;
  metric: MilestoneRoadmapMetric;
  maxValue: number;
  items: ReturnType<typeof milestoneRoadmapToTimeline>["sprints"][number]["cell"]["items"];
  onSelectLabel: (label: string) => void;
  selectedLabel: string | null;
}>) {
  const milestoneContext = {
    titulo: milestoneTitulo,
    start_date: startDate,
    due_date: dueDate,
  };

  if (items.length === 0) {
    return (
      <div className="flex h-full min-h-[7rem] items-center justify-center text-xs text-slate-400">
        —
      </div>
    );
  }

  return (
    <ul className="flex min-h-[7rem] flex-col gap-1.5">
      {items.map((item) => {
        const intensity = milestoneRoadmapBarIntensity(item.value, maxValue);
        const href = buildMilestoneRoadmapIssuesHref(milestoneContext, groupBy, item.label);
        const isSelected = selectedLabel === item.label;

        return (
          <li key={`${milestoneIid}-${item.label}`}>
            <button
              type="button"
              onClick={() => onSelectLabel(item.label)}
              className={`w-full rounded-md border px-2 py-1.5 text-left transition-colors ${
                isSelected
                  ? "border-govbr-blue bg-blue-50"
                  : "border-slate-100 bg-slate-50 hover:border-slate-200 hover:bg-white"
              }`}
              title={`${item.label}\n${formatNumber(item.entregues)} issues · ${formatNumber(item.pontos_entregues)} pontos`}
            >
              <div className="mb-1 flex items-start justify-between gap-1">
                <span
                  className={`line-clamp-2 text-[11px] font-medium leading-tight ${
                    isSelected ? "text-govbr-blue" : "text-slate-800"
                  }`}
                >
                  {item.label}
                </span>
                <span className="shrink-0 text-[10px] text-slate-500">#{item.rank}</span>
              </div>
              <div
                className="mb-1 h-1.5 overflow-hidden rounded-full bg-slate-200"
                aria-hidden="true"
              >
                <span
                  className="block h-full rounded-full bg-emerald-500"
                  style={{ width: `${Math.max(intensity * 100, item.value > 0 ? 8 : 0)}%` }}
                />
              </div>
              <div className="flex items-center justify-between gap-1 text-[10px] text-slate-600">
                <span>
                  {metric === "issues"
                    ? `${formatNumber(item.entregues)} iss.`
                    : `${formatNumber(item.pontos_entregues)} pts`}
                </span>
                {href ? (
                  <IssueCountLink
                    count={item.entregues}
                    href={href}
                    label={`${item.label} — sprint ${milestoneIid}`}
                  >
                    <span className="text-govbr-blue hover:underline">ver</span>
                  </IssueCountLink>
                ) : null}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function MilestoneRoadmapPanel({
  milestones,
  fromIid,
  toIid,
  groupBy,
  metric,
  topN,
  selectedLabel,
  rows,
  hasStoryPoints,
}: Readonly<MilestoneRoadmapPanelProps>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const timeline = milestoneRoadmapToTimeline(rows, metric);
  const lineSeries = milestoneRoadmapToLineSeries(rows, selectedLabel, metric);
  const metricLabel = metric === "issues" ? "Issues entregues" : "Story points entregues";
  const groupLabel = MILESTONE_ROADMAP_GROUP_LABELS[groupBy];

  const sprintDates = new Map<number, { start_date: string | null; due_date: string | null }>();
  for (const row of rows) {
    if (!sprintDates.has(row.milestone_iid)) {
      sprintDates.set(row.milestone_iid, {
        start_date: row.milestone_start_date,
        due_date: row.milestone_due_date,
      });
    }
  }

  function pushParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value == null || value === "") params.delete(key);
      else params.set(key, value);
    }
    startTransition(() => {
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  }

  const iidOptions = milestoneIidsDesc(milestones);

  return (
    <section className="overflow-visible rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <CardSectionHeader
        title="Roadmap por sprint"
        subtitle={`Sprints ${fromIid} → ${toIid} · top ${topN} ${groupLabel.toLowerCase()}s · ${metricLabel.toLowerCase()}`}
        tooltip="Timeline horizontal das entregas por sprint — compare módulos como PNCP e Contratos ao longo do tempo."
      />

      <div className="mb-4 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-950">
        {MILESTONE_ROADMAP_ANTI_PUNITIVE_NOTE}
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-slate-600">De (sprint)</span>
          <select
            aria-label="Sprint inicial"
            value={String(fromIid)}
            onChange={(event) => pushParams({ from: event.target.value })}
            className="min-w-[6rem] rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
          >
            {iidOptions.map((iid) => (
              <option key={iid} value={iid}>
                {iid}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-slate-600">Até (sprint)</span>
          <select
            aria-label="Sprint final"
            value={String(toIid)}
            onChange={(event) => pushParams({ to: event.target.value })}
            className="min-w-[6rem] rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
          >
            {iidOptions.map((iid) => (
              <option key={iid} value={iid}>
                {iid}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-slate-600">Agrupar por</span>
          <select
            aria-label="Agrupamento do roadmap"
            value={groupBy}
            onChange={(event) =>
              pushParams({
                roadmapGroup: event.target.value,
                roadmapLabel: null,
              })
            }
            className="min-w-[8rem] rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
          >
            <option value="modulo">Módulo</option>
            <option value="epico">Épico</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-slate-600">Top por sprint</span>
          <select
            aria-label="Quantidade por célula"
            value={String(topN)}
            onChange={(event) => pushParams({ roadmapTopN: event.target.value })}
            className="min-w-[5rem] rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
          >
            {MILESTONE_ROADMAP_TOP_N_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-slate-600">Métrica</span>
          <select
            aria-label="Métrica do roadmap"
            value={metric}
            onChange={(event) =>
              pushParams({ roadmapMetric: event.target.value as MilestoneRoadmapMetric })
            }
            className="min-w-[8rem] rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
          >
            <option value="pontos">Story points</option>
            <option value="issues">Issues</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-slate-600">{groupLabel} (série)</span>
          <select
            aria-label={`${groupLabel} para gráfico de linha`}
            value={selectedLabel ?? ""}
            onChange={(event) => pushParams({ roadmapLabel: event.target.value || null })}
            className="min-w-[10rem] rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
          >
            {[...new Set(rows.map((row) => row.label))].length === 0 ? (
              <option value="">Nenhum registro</option>
            ) : (
              [...new Set(rows.map((row) => row.label))]
                .sort((a, b) => a.localeCompare(b, "pt-BR"))
                .map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))
            )}
          </select>
        </label>
      </div>

      {!hasStoryPoints && metric === "pontos" ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Nenhum story point importado no intervalo. Importe Planning Poker em Importar Dados ou
          alterne para issues.
        </div>
      ) : null}

      {timeline.sprints.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500">
          Sem entregas no intervalo selecionado.
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">
              Timeline — top {groupLabel.toLowerCase()}s por sprint
            </h3>
            <div className="overflow-x-auto pb-2">
              <div
                className="inline-flex min-w-full gap-3"
                style={{ minWidth: `${Math.max(timeline.sprints.length * 11, 100)}rem` }}
              >
                {timeline.sprints.map((sprint) => {
                  const dates = sprintDates.get(sprint.milestone_iid);

                  return (
                    <div
                      key={sprint.milestone_iid}
                      className="w-44 shrink-0 rounded-lg border border-slate-200 bg-white p-2 shadow-sm"
                    >
                      <div className="mb-2 border-b border-slate-100 pb-2 text-center">
                        <p className="text-sm font-semibold text-slate-800">{sprint.label}</p>
                        <p
                          className="line-clamp-2 text-[10px] text-slate-500"
                          title={sprint.titulo}
                        >
                          {sprint.titulo}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-500">
                          {formatNumber(sprint.cell.totalEntregues)} iss. ·{" "}
                          {formatNumber(sprint.cell.totalPontos)} pts
                        </p>
                      </div>
                      <RoadmapTimelineCell
                        milestoneIid={sprint.milestone_iid}
                        milestoneTitulo={sprint.titulo}
                        startDate={dates?.start_date ?? null}
                        dueDate={dates?.due_date ?? null}
                        groupBy={groupBy}
                        metric={metric}
                        maxValue={timeline.maxCellValue}
                        items={sprint.cell.items}
                        selectedLabel={selectedLabel}
                        onSelectLabel={(label) => pushParams({ roadmapLabel: label })}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Role horizontalmente para percorrer {timeline.sprints.length} sprints. Clique em um{" "}
              {groupLabel.toLowerCase()} para ver a tendência ao longo do tempo.
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-800">
              Tendência{selectedLabel ? `: ${selectedLabel}` : ""}
            </h3>
            {lineSeries.length === 0 ? (
              <div className="flex h-48 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500">
                Selecione um {groupLabel.toLowerCase()} com entregas no intervalo.
              </div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineSeries} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis allowDecimals={false} />
                    <Tooltip
                      formatter={(value, _name, item) => {
                        const payload = item.payload as (typeof lineSeries)[number];
                        if (metric === "issues") {
                          return [`${value} issues`, `Sprint ${payload.milestone_iid}`];
                        }
                        return [
                          `${value} pts (${formatNumber(payload.entregues)} issues)`,
                          payload.titulo,
                        ];
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name={metricLabel}
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
