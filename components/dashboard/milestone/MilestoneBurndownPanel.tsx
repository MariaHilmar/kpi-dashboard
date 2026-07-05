"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CardSectionHeader } from "@/components/dashboard/CardSectionHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import {
  lastMinuteIndexLabel,
  type LastMinuteDeliveryKpi,
  type MilestoneBurndownChartPoint,
  type MilestoneBurndownGranularity,
  type MilestoneBurndownMetric,
  type MilestoneBurndownSprintCompare,
} from "@/lib/dashboard/milestone-burndown";
import { formatDecimal, formatPercent } from "@/lib/format";

type MilestoneBurndownPanelProps = {
  milestoneIid: number;
  startDate: string | null;
  dueDate: string | null;
  metric: MilestoneBurndownMetric;
  granularity: MilestoneBurndownGranularity;
  series: MilestoneBurndownChartPoint[];
  kpi: LastMinuteDeliveryKpi;
  compareSprints: MilestoneBurndownSprintCompare[];
  hasStoryPoints: boolean;
};

type TooltipPayload = {
  payload?: MilestoneBurndownChartPoint;
};

function BurndownTooltip({
  active,
  payload,
  metric,
}: Readonly<{
  active?: boolean;
  payload?: TooltipPayload[];
  metric: MilestoneBurndownMetric;
}>) {
  if (!active || !payload?.[0]?.payload) return null;

  const point = payload[0].payload;
  const unit = metric === "issues" ? "issues" : "pontos";

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-semibold text-slate-800">{point.label}</p>
      <p>
        Restante: <strong>{point.remaining}</strong> {unit}
      </p>
      <p>
        Entregue: <strong>{point.done}</strong> / {point.committed} {unit}
      </p>
      <p>
        Ideal (restante):{" "}
        <strong>{point.ideal == null ? "—" : formatDecimal(point.ideal, 1)}</strong>
      </p>
      <p className="text-slate-500">
        Fonte: {point.source === "snapshot" ? "snapshot diário" : "reconstruído"}
      </p>
    </div>
  );
}

function BurnupTooltip({
  active,
  payload,
  metric,
}: Readonly<{
  active?: boolean;
  payload?: TooltipPayload[];
  metric: MilestoneBurndownMetric;
}>) {
  if (!active || !payload?.[0]?.payload) return null;

  const point = payload[0].payload;
  const unit = metric === "issues" ? "issues" : "pontos";

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-semibold text-slate-800">{point.label}</p>
      <p>
        Entregue: <strong>{point.done}</strong> / {point.committed} {unit}
      </p>
      <p>
        Acumulado: <strong>{formatPercent(point.pctDelivered)}</strong>
      </p>
    </div>
  );
}

function SprintSparkline({
  sprint,
  isActive,
  onSelect,
}: Readonly<{
  sprint: MilestoneBurndownSprintCompare;
  isActive: boolean;
  onSelect: () => void;
}>) {
  const data = sprint.pctSeries.map((point) => ({
    label: point.snapshot_date.slice(5),
    pct: point.pctDelivered,
  }));

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex min-w-[7rem] flex-col rounded-lg border px-2 py-2 text-left transition-colors ${
        isActive
          ? "border-govbr-blue bg-blue-50"
          : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
      }`}
      title={`Sprint ${sprint.milestoneIid} — índice last-minute ${sprint.kpi.lastMinuteIndex ?? "—"}`}
    >
      <span className="text-xs font-semibold text-slate-800">Sprint {sprint.milestoneIid}</span>
      <div className="mt-1 h-10 w-full">
        {data.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
              <Line
                type="monotone"
                dataKey="pct"
                stroke={isActive ? "#1351b4" : "#64748b"}
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <span className="text-[10px] text-slate-400">Sem série</span>
        )}
      </div>
      <span className="mt-1 text-[10px] text-slate-600">
        Últ. sem.: {formatPercent(sprint.kpi.lastWeekPct)} · Meio:{" "}
        {formatPercent(sprint.kpi.midpointPct)}
      </span>
    </button>
  );
}

export function MilestoneBurndownPanel({
  milestoneIid,
  startDate,
  dueDate,
  metric,
  granularity,
  series,
  kpi,
  compareSprints,
  hasStoryPoints,
}: Readonly<MilestoneBurndownPanelProps>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const metricLabel = metric === "issues" ? "Issues" : "Story points";
  const hasIdeal = series.some((point) => point.ideal != null);

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

  return (
    <section className="overflow-visible rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <CardSectionHeader
        title="Burndown e burnup"
        subtitle={`Sprint ${milestoneIid} · ${metricLabel.toLowerCase()} · ${granularity === "day" ? "eixo diário" : "eixo semanal"}`}
        tooltip="Série temporal diária a partir de milestone_daily_snapshots (preferência) ou reconstrução por fechado_em. Linha ideal usa start_date, due_date e escopo comprometido."
      />

      <div className="mb-4 flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-slate-600">Métrica</span>
          <select
            aria-label="Métrica burndown"
            value={metric}
            onChange={(event) =>
              pushParams({ burndownMetric: event.target.value as MilestoneBurndownMetric })
            }
            className="min-w-[8rem] rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
          >
            <option value="pontos">Story points</option>
            <option value="issues">Issues</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-slate-600">Eixo temporal</span>
          <select
            aria-label="Granularidade burndown"
            value={granularity}
            onChange={(event) =>
              pushParams({
                burndownGranularity: event.target.value as MilestoneBurndownGranularity,
              })
            }
            className="min-w-[8rem] rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
          >
            <option value="day">Diário</option>
            <option value="week">Semanal</option>
          </select>
        </label>
      </div>

      {!hasStoryPoints && metric === "pontos" ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Nenhum story point no escopo. Importe Planning Poker ou alterne para issues.
        </div>
      ) : null}

      {!startDate || !dueDate ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          start_date e due_date são necessários para a linha ideal e o índice last-minute delivery.
        </div>
      ) : (
        <p className="mb-4 text-sm text-slate-600">
          Janela: <strong>{startDate}</strong> → <strong>{dueDate}</strong>
          {hasIdeal ? null : " · linha ideal indisponível (intervalo inválido ou escopo vazio)"}
        </p>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Entregue ao meio da sprint"
          value={formatPercent(kpi.midpointPct)}
          hint={
            kpi.midpointDate
              ? `Acumulado até ${kpi.midpointDate} (~50% do intervalo)`
              : "Requer datas da milestone"
          }
        />
        <KpiCard
          label="Entregue na última semana"
          value={formatPercent(kpi.lastWeekPct)}
          hint={
            kpi.lastWeekStart
              ? `Fechamentos de ${kpi.lastWeekStart} até ${dueDate ?? "fim"}`
              : "Requer datas da milestone"
          }
        />
        <KpiCard
          label="Índice last-minute"
          value={kpi.lastMinuteIndex == null ? "—" : formatDecimal(kpi.lastMinuteIndex, 2)}
          hint="Última semana ÷ meio da sprint (% entregue). Substitui tendência de atraso (#43)."
        />
        <KpiCard
          label="Leitura"
          value={lastMinuteIndexLabel(kpi.lastMinuteIndex)}
          hint={lastMinuteIndexLabel(kpi.lastMinuteIndex)}
        />
      </div>

      {compareSprints.length > 1 ? (
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-semibold text-slate-800">
            Comparativo entre sprints (% entregue)
          </h3>
          <div className="flex flex-wrap gap-2">
            {compareSprints.map((sprint) => (
              <SprintSparkline
                key={sprint.milestoneIid}
                sprint={sprint}
                isActive={sprint.milestoneIid === milestoneIid}
                onSelect={() => pushParams({ iid: String(sprint.milestoneIid) })}
              />
            ))}
          </div>
        </div>
      ) : null}

      {series.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500">
          Sem dados de burndown para esta sprint.
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Burndown (restante)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={series} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                    angle={granularity === "day" ? -35 : -20}
                    textAnchor="end"
                    height={56}
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip content={<BurndownTooltip metric={metric} />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="remaining"
                    name="Restante"
                    stroke="#dc2626"
                    strokeWidth={2}
                    dot={false}
                  />
                  {hasIdeal ? (
                    <Line
                      type="monotone"
                      dataKey="ideal"
                      name="Ideal"
                      stroke="#94a3b8"
                      strokeWidth={2}
                      strokeDasharray="6 4"
                      dot={false}
                      connectNulls={false}
                    />
                  ) : null}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Burnup (entregue)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={series} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                    angle={granularity === "day" ? -35 : -20}
                    textAnchor="end"
                    height={56}
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip content={<BurnupTooltip metric={metric} />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="done"
                    name="Entregue"
                    stroke="#16a34a"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="committed"
                    name="Comprometido"
                    stroke="#cbd5e1"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="xl:col-span-2">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">
              Curva cumulativa (% entregue)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                    angle={-35}
                    textAnchor="end"
                    height={56}
                  />
                  <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                  <Tooltip
                    formatter={(value) => [formatPercent(Number(value)), "% entregue"]}
                    labelFormatter={(label) => String(label)}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="pctDelivered"
                    name="% entregue"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
