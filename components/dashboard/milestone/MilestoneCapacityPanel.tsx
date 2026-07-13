"use client";

import { useMilestoneUrlParams } from "@/hooks/useMilestoneUrlParams";
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
import { TODOS } from "@/lib/dashboard/constants";
import { milestoneIidsDesc, type MilestoneOption } from "@/lib/dashboard/milestone-options";
import {
  MILESTONE_CAPACITY_ANTI_PUNITIVE_NOTE,
  milestoneCapacityHeatmapIntensity,
  milestoneCapacityMetricLabel,
  milestoneCapacityToHeatmap,
  milestoneCapacityToLineSeries,
  type MilestoneCapacityHeatmap,
  type MilestoneCapacityMetric,
  type MilestoneCapacityRow,
} from "@/lib/dashboard/milestone-capacity";
import { formatNumber } from "@/lib/format";

type MilestoneCapacityPanelProps = {
  milestones: MilestoneOption[];
  fromIid: number;
  toIid: number;
  metric: MilestoneCapacityMetric;
  selectedTeam: string;
  teamOptions: string[];
  rows: MilestoneCapacityRow[];
  hasStoryPoints: boolean;
};

function heatmapCellStyle(value: number, maxValue: number): { backgroundColor: string } {
  const intensity = milestoneCapacityHeatmapIntensity(value, maxValue);
  if (intensity <= 0) {
    return { backgroundColor: "#f8fafc" };
  }
  const alpha = 0.15 + intensity * 0.75;
  return { backgroundColor: `rgba(22, 163, 74, ${alpha})` };
}

function CapacityHeatmap({
  heatmap,
  metric,
  selectedTeam,
  onSelectTeam,
}: Readonly<{
  heatmap: MilestoneCapacityHeatmap;
  metric: MilestoneCapacityMetric;
  selectedTeam: string;
  onSelectTeam: (team: string) => void;
}>) {
  const heatmapMetricHint =
    metric === "issues" ? "issues fechadas na sprint" : "pontos entregues na sprint";

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-white px-2 py-2 text-left font-semibold text-slate-600">
              Equipe
            </th>
            {heatmap.sprints.map((sprint) => (
              <th
                key={sprint.milestone_iid}
                className="min-w-[2.75rem] px-1 py-2 text-center font-semibold text-slate-600"
                title={sprint.titulo}
              >
                {sprint.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {heatmap.teams.map((team) => {
            const isTotalRow = team === TODOS;
            const isSelected = selectedTeam === team;

            return (
            <tr
              key={team}
              className={isTotalRow ? "border-b-2 border-slate-200" : undefined}
            >
              <th
                scope="row"
                className={`sticky left-0 z-10 px-2 py-1.5 text-left ${
                  isTotalRow ? "bg-green-50 font-semibold" : "bg-white font-medium"
                } ${isSelected ? "text-govbr-blue" : "text-slate-800"}`}
              >
                <button
                  type="button"
                  onClick={() => onSelectTeam(team)}
                  className={`max-w-[8rem] truncate text-left hover:text-govbr-blue hover:underline ${
                    isTotalRow ? "font-semibold" : ""
                  }`}
                  title={
                    isTotalRow
                      ? "Ver tendência de todas as equipes"
                      : `Ver tendência de ${team}`
                  }
                >
                  {team}
                </button>
              </th>
              {heatmap.sprints.map((sprint) => {
                const cell = heatmap.cells.find(
                  (item) => item.milestone_iid === sprint.milestone_iid && item.equipe === team,
                );
                const value = cell?.value ?? 0;

                return (
                  <td
                    key={`${team}-${sprint.milestone_iid}`}
                    className="border border-slate-100 px-1 py-1 text-center text-slate-800"
                    style={heatmapCellStyle(value, heatmap.maxValue)}
                    title={`Sprint ${sprint.milestone_iid} · ${team}\n${formatNumber(cell?.fechadas ?? 0)} fechadas · ${formatNumber(cell?.entregues ?? 0)} entregues · ${formatNumber(cell?.pontos_entregues ?? 0)} pontos`}
                  >
                    {value > 0 ? formatNumber(value) : ""}
                  </td>
                );
              })}
            </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-slate-500">
        A primeira linha (<strong>Todos</strong>) soma todas as equipes. Intensidade da cor ={" "}
        {heatmapMetricHint}. Clique em uma linha para alterar a série temporal abaixo.
      </p>
    </div>
  );
}

export function MilestoneCapacityPanel({
  milestones,
  fromIid,
  toIid,
  metric,
  selectedTeam,
  teamOptions,
  rows,
  hasStoryPoints,
}: Readonly<MilestoneCapacityPanelProps>) {
  const { pushParams } = useMilestoneUrlParams();

  const metricLabel = milestoneCapacityMetricLabel(metric);

  const iidOptions = milestoneIidsDesc(milestones);
  const heatmap = milestoneCapacityToHeatmap(rows, metric, teamOptions);
  const lineSeries = milestoneCapacityToLineSeries(rows, selectedTeam, metric, teamOptions);

  return (
    <section className="overflow-visible rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <CardSectionHeader
        title="Capacidade por equipe"
        subtitle={`Sprints ${fromIid} → ${toIid} · ${metricLabel.toLowerCase()}`}
        tooltip="Issues fechadas (alinhadas ao KPI Fechadas da página Sprint) ou story points entregues no intervalo da milestone — por equipe sprint a sprint."
      />

      <div className="mb-4 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-950">
        {MILESTONE_CAPACITY_ANTI_PUNITIVE_NOTE}
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
          <span className="font-medium text-slate-600">Métrica</span>
          <select
            aria-label="Métrica de capacidade"
            value={metric}
            onChange={(event) =>
              pushParams({ capacityMetric: event.target.value as MilestoneCapacityMetric })
            }
            className="min-w-[8rem] rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
          >
            <option value="pontos">Story points</option>
            <option value="issues">Issues</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-slate-600">Equipe</span>
          <select
            aria-label="Equipe para tendência"
            value={selectedTeam}
            onChange={(event) => {
              const value = event.target.value;
              pushParams({ capacityTeam: value === TODOS ? null : value });
            }}
            className="min-w-[10rem] rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
          >
            {teamOptions.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!hasStoryPoints && metric === "pontos" ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Nenhum story point importado no intervalo. Importe Planning Poker em Importar Dados ou
          alterne para issues.
        </div>
      ) : null}

      {heatmap.teams.length === 0 || heatmap.sprints.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500">
          Sem dados por equipe no intervalo selecionado.
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Heatmap equipe × sprint</h3>
            <CapacityHeatmap
              heatmap={heatmap}
              metric={metric}
              selectedTeam={selectedTeam}
              onSelectTeam={(team) =>
                pushParams({ capacityTeam: team === TODOS ? null : team })
              }
            />
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-800">
              Tendência
              {selectedTeam === TODOS ? ": todas as equipes" : `: ${selectedTeam}`}
            </h3>
            {lineSeries.length === 0 ? (
              <div className="flex h-48 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500">
                {selectedTeam === TODOS
                  ? "Sem entregas no intervalo selecionado."
                  : "Nenhuma entrega para esta equipe no intervalo."}
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
                          return [`${value} fechadas`, `Sprint ${payload.milestone_iid}`];
                        }
                        return [
                          `${value} pts (${formatNumber(payload.entregues)} entregues)`,
                          payload.titulo,
                        ];
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name={metricLabel}
                      stroke="#16a34a"
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
