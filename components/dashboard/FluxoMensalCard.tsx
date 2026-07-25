"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CardSectionHeader } from "@/components/dashboard/CardSectionHeader";
import {
  DEFAULT_EVOLUCAO_MENSAL_WINDOW,
  EVOLUCAO_MENSAL_WINDOW_PARAM,
  EVOLUCAO_MENSAL_WINDOWS,
  filterFluxoMensalByWindow,
  parseEvolucaoMensalWindow,
  type EvolucaoMensalWindow,
} from "@/lib/dashboard/fluxo-mensal-range";
import type { FluxoMensal } from "@/types/database";

type FluxoMensalCardProps = {
  title: string;
  subtitle?: string;
  titleTooltip?: string;
  data: FluxoMensal[];
};

export function FluxoMensalCard({ title, subtitle, titleTooltip, data }: FluxoMensalCardProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedWindow, setSelectedWindow] = useState<EvolucaoMensalWindow>(() =>
    parseEvolucaoMensalWindow(searchParams.get(EVOLUCAO_MENSAL_WINDOW_PARAM)),
  );

  useEffect(() => {
    function syncFromUrl() {
      const params = new URLSearchParams(window.location.search);
      setSelectedWindow(parseEvolucaoMensalWindow(params.get(EVOLUCAO_MENSAL_WINDOW_PARAM)));
    }

    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  const chartData = useMemo(
    () => filterFluxoMensalByWindow(data, selectedWindow),
    [data, selectedWindow],
  );

  function setWindow(next: EvolucaoMensalWindow) {
    setSelectedWindow(next);

    const params = new URLSearchParams(searchParams.toString());
    if (next === DEFAULT_EVOLUCAO_MENSAL_WINDOW) {
      params.delete(EVOLUCAO_MENSAL_WINDOW_PARAM);
    } else {
      params.set(EVOLUCAO_MENSAL_WINDOW_PARAM, next);
    }

    const query = params.toString();
    const href = query ? `${pathname}?${query}` : pathname;
    window.history.replaceState(null, "", href);
  }

  return (
    <section className="overflow-visible rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <CardSectionHeader title={title} subtitle={subtitle} tooltip={titleTooltip} />

      <fieldset className="mb-4">
        <legend className="mb-2 text-xs font-medium text-slate-600">Janela do gráfico</legend>
        <div className="flex flex-wrap gap-1.5">
          {EVOLUCAO_MENSAL_WINDOWS.map((window) => {
            const selected = selectedWindow === window.id;
            return (
              <label
                key={window.id}
                className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition ${
                  selected
                    ? "border-govbr-blue bg-govbr-blue text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="evolucaoJanela"
                  value={window.id}
                  checked={selected}
                  onChange={() => setWindow(window.id)}
                  className="sr-only"
                />
                {window.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      {chartData.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500">
          Sem dados temporais.
        </div>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
            >
              <defs>
                <linearGradient id="colorBacklog" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9333ea" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#9333ea" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 11 }}
                interval={Math.ceil(chartData.length / 12)}
              />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="backlog_liquido"
                name="Backlog líquido"
                fill="url(#colorBacklog)"
                stroke="#9333ea"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="criados"
                name="Criados"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="fechados"
                name="Fechados"
                stroke="#16a34a"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="mergeadas"
                name="Mergeadas"
                stroke="#ea580c"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
