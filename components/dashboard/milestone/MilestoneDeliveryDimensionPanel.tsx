"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
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
import { IssueCountLink } from "@/components/dashboard/IssueCountLink";
import { buildMilestoneDeliveryIssuesHref } from "@/lib/dashboard/issuesLinks";
import {
  DEFAULT_MILESTONE_DELIVERY_ORDER,
  MILESTONE_DELIVERY_ANTI_PUNITIVE_NOTE,
  MILESTONE_DELIVERY_DIMENSION_LABELS,
  MILESTONE_DELIVERY_DIMENSIONS,
  MILESTONE_DELIVERY_LIMIT_OPTIONS,
  MILESTONE_DELIVERY_SORT_COLUMNS,
  milestoneDeliveryMaxVolume,
  milestoneDeliveryToComparisonBars,
  sortMilestoneDeliveryRows,
  type MilestoneDeliveryDimension,
  type MilestoneDeliveryRow,
} from "@/lib/dashboard/milestone-delivery";
import type { MilestoneDetail } from "@/lib/dashboard/milestone-report";
import {
  getColumnSortDirection,
  resolveSortOrder,
  toggleColumnOrder,
} from "@/lib/dashboard/table-sort";
import { formatNumber } from "@/lib/format";

type MilestoneDeliveryDimensionPanelProps = {
  milestone: MilestoneDetail;
  dimension: MilestoneDeliveryDimension;
  limit: number;
  order: string;
  rows: MilestoneDeliveryRow[];
  hasStoryPoints: boolean;
};

function DeliveryMiniBar({
  entregues,
  wip,
  max,
}: Readonly<{ entregues: number; wip: number; max: number }>) {
  if (max <= 0) return <span className="text-slate-400">—</span>;

  const entreguesWidth = Math.round((entregues / max) * 100);
  const wipWidth = Math.round((wip / max) * 100);

  return (
    <div
      className="flex h-2 min-w-[5rem] overflow-hidden rounded-full bg-slate-100"
      title={`Entregues: ${entregues} · WIP: ${wip}`}
      aria-hidden="true"
    >
      {entregues > 0 ? (
        <span className="h-full bg-emerald-500" style={{ width: `${entreguesWidth}%` }} />
      ) : null}
      {wip > 0 ? (
        <span className="h-full bg-amber-400" style={{ width: `${wipWidth}%` }} />
      ) : null}
    </div>
  );
}

export function MilestoneDeliveryDimensionPanel({
  milestone,
  dimension,
  limit,
  order,
  rows,
  hasStoryPoints,
}: Readonly<MilestoneDeliveryDimensionPanelProps>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const sortedRows = sortMilestoneDeliveryRows(rows, order);
  const chartData = milestoneDeliveryToComparisonBars(sortedRows);
  const maxVolume = milestoneDeliveryMaxVolume(sortedRows);
  const resolvedOrder = resolveSortOrder(
    order,
    MILESTONE_DELIVERY_SORT_COLUMNS,
    DEFAULT_MILESTONE_DELIVERY_ORDER,
  );

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

  function handleSort(columnKey: string) {
    const nextOrder = toggleColumnOrder(
      resolvedOrder,
      columnKey,
      MILESTONE_DELIVERY_SORT_COLUMNS,
    );
    pushParams({ deliveryOrder: nextOrder });
  }

  const dimensionLabel = MILESTONE_DELIVERY_DIMENSION_LABELS[dimension];

  return (
    <section className="overflow-visible rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <CardSectionHeader
        title="Entrega por dimensão"
        subtitle={`Top ${limit} · ${dimensionLabel}`}
        tooltip="Issues entregues no intervalo da sprint, pontos (Planning Poker) e WIP restante no snapshot — por equipe, responsável, módulo ou parceria."
      />

      <div className="mb-4 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-950">
        {MILESTONE_DELIVERY_ANTI_PUNITIVE_NOTE}
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-slate-600">Dimensão</span>
          <select
            aria-label="Dimensão de entrega"
            value={dimension}
            onChange={(event) =>
              pushParams({ deliveryDim: event.target.value, deliveryOrder: null })
            }
            className="min-w-[10rem] rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
          >
            {MILESTONE_DELIVERY_DIMENSIONS.map((value) => (
              <option key={value} value={value}>
                {MILESTONE_DELIVERY_DIMENSION_LABELS[value]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-slate-600">Top N</span>
          <select
            aria-label="Quantidade de linhas"
            value={String(limit)}
            onChange={(event) => pushParams({ deliveryLimit: event.target.value })}
            className="min-w-[5rem] rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
          >
            {MILESTONE_DELIVERY_LIMIT_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>

      {chartData.length === 0 ? (
        <div className="mb-4 flex h-40 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500">
          Sem entregas ou WIP nesta dimensão.
        </div>
      ) : (
        <div className="mb-6 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="label" width={112} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="entregues" name="Entregues" fill="#16a34a" radius={[0, 4, 4, 0]} />
              <Bar dataKey="wip" name="WIP restante" fill="#f59e0b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {sortedRows.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500">
          Nenhum registro para {dimensionLabel.toLowerCase()}.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <MilestoneDeliverySortableTh
                  columnKey="label"
                  label={dimensionLabel}
                  order={resolvedOrder}
                  onSort={handleSort}
                />
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Mix
                </th>
                <MilestoneDeliverySortableTh
                  columnKey="entregues"
                  label="Entregues"
                  order={resolvedOrder}
                  onSort={handleSort}
                  align="right"
                />
                {hasStoryPoints ? (
                  <MilestoneDeliverySortableTh
                    columnKey="pontos_entregues"
                    label="Pontos"
                    order={resolvedOrder}
                    onSort={handleSort}
                    align="right"
                  />
                ) : null}
                <MilestoneDeliverySortableTh
                  columnKey="wip_restante"
                  label="WIP"
                  order={resolvedOrder}
                  onSort={handleSort}
                  align="right"
                />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {sortedRows.map((row) => {
                const deliveredHref = buildMilestoneDeliveryIssuesHref(
                  milestone,
                  dimension,
                  row.label,
                  "entregues",
                );
                const wipHref = buildMilestoneDeliveryIssuesHref(
                  milestone,
                  dimension,
                  row.label,
                  "wip",
                );

                return (
                  <tr key={row.label} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-800">{row.label}</td>
                    <td className="px-3 py-2">
                      <DeliveryMiniBar
                        entregues={row.entregues}
                        wip={row.wip_restante}
                        max={maxVolume}
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-slate-700">
                      <IssueCountLink
                        count={row.entregues}
                        href={deliveredHref}
                        label={`${row.label} — entregues`}
                      >
                        {formatNumber(row.entregues)}
                      </IssueCountLink>
                    </td>
                    {hasStoryPoints ? (
                      <td className="px-3 py-2 text-right text-slate-700">
                        {formatNumber(row.pontos_entregues)}
                      </td>
                    ) : null}
                    <td className="px-3 py-2 text-right text-slate-700">
                      <IssueCountLink
                        count={row.wip_restante}
                        href={wipHref}
                        label={`${row.label} — WIP`}
                      >
                        {formatNumber(row.wip_restante)}
                      </IssueCountLink>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

type SortableThProps = {
  columnKey: string;
  label: string;
  order: string;
  onSort: (nextOrder: string) => void;
  align?: "left" | "right";
};

function MilestoneDeliverySortableTh({
  columnKey,
  label,
  order,
  onSort,
  align = "left",
}: Readonly<SortableThProps>) {
  const direction = getColumnSortDirection(
    order,
    columnKey,
    MILESTONE_DELIVERY_SORT_COLUMNS,
  );

  return (
    <th
      scope="col"
      className={`px-3 py-2 ${align === "right" ? "text-right" : "text-left"}`}
    >
      <button
        type="button"
        onClick={() => onSort(columnKey)}
        className={`inline-flex max-w-full items-center gap-0.5 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-govbr-blue ${
          align === "right" ? "ml-auto" : ""
        } ${direction ? "text-govbr-blue" : ""}`}
        aria-label={`Ordenar por ${label}${
          direction ? ` (${direction === "asc" ? "crescente" : "decrescente"})` : ""
        }`}
      >
        <span className="truncate">{label}</span>
        <span aria-hidden="true" className={direction ? "text-govbr-blue" : "text-slate-300"}>
          {direction === "asc" ? "▲" : direction === "desc" ? "▼" : "↕"}
        </span>
      </button>
    </th>
  );
}
