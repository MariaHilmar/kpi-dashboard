"use client";



import { IssueCountLink } from "@/components/dashboard/IssueCountLink";

import { buildAlertasResumoIssuesHref } from "@/lib/dashboard/issuesLinks";

import { formatNumber } from "@/lib/format";

import type { AlertaResumo, DashboardFilters } from "@/types/database";



type AlertasResumoProps = {

  data: AlertaResumo | null;

  filters: DashboardFilters;

};



export function AlertasResumo({ data, filters }: AlertasResumoProps) {

  if (!data) return null;



  const cards = [

    {

      label: "Issues Abertas",

      value: data.abertas,

      color: "bg-blue-50 border-blue-200",

      href:

        data.abertas > 0 ? buildAlertasResumoIssuesHref(filters, "abertas") : null,

    },

    {

      label: "Issues sem épicos definidos",

      value: data.sem_epico,

      color: "bg-amber-50 border-amber-200",

      href:

        data.sem_epico > 0 ? buildAlertasResumoIssuesHref(filters, "sem_epico") : null,

    },

    {

      label: "Issues sem parcerias definidas",

      value: data.sem_parceria,

      color: "bg-rose-50 border-rose-200",

      href:

        data.sem_parceria > 0 ? buildAlertasResumoIssuesHref(filters, "sem_parceria") : null,

    },

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

              <IssueCountLink count={card.value} href={card.href} label={card.label}>

                {formatNumber(card.value)}

              </IssueCountLink>

            </p>

          </div>

        ))}

      </div>

    </section>

  );

}

