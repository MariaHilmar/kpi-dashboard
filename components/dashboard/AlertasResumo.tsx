"use client";

import { formatNumber } from "@/lib/format";
import type { AlertaResumo } from "@/types/database";

type AlertasResumoProps = {
  data: AlertaResumo | null;
};

export function AlertasResumo({ data }: AlertasResumoProps) {
  if (!data) return null;

  const cards = [
    { label: "Issues Abertas", value: data.abertas, color: "bg-blue-50 border-blue-200" },
    { label: "Sem Épico", value: data.sem_epico, color: "bg-amber-50 border-amber-200" },
    { label: "Sem Parceria", value: data.sem_parceria, color: "bg-rose-50 border-rose-200" },
  ];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-slate-900">Alertas — visão geral</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className={`rounded-lg border p-4 ${card.color}`}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
              {card.label}
            </p>
            <p className="mt-1 text-3xl font-semibold text-slate-900">
              {formatNumber(card.value)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
