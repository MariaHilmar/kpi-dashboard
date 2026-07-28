"use client";

import { useState, type ReactNode } from "react";

import { CardSectionHeader } from "@/components/dashboard/CardSectionHeader";
import { MergeadasPivotDimensaoToggle } from "@/components/dashboard/executivo/MergeadasPivotDimensaoToggle";
import { IssueCountLink } from "@/components/dashboard/IssueCountLink";
import { buildMergeadasPivotIssuesHref } from "@/lib/dashboard/issuesLinks";
import {
  buildPivotLinhas,
  mergeadasPivotDimensaoLabel,
  pivotPeriodTotals,
  type MergeadasPivotDimensao,
} from "@/lib/dashboard/mergeadas-pivot";
import { formatPeriodoLabel } from "@/lib/dashboard/mergeadas-format";
import { formatNumber } from "@/lib/format";
import type { DashboardFilters, MergeadaPivotRow } from "@/types/database";
const NAO_INFORMADO = "Não informado";

function comparePivotLinhas(
  a: { linha: string },
  b: { linha: string },
) {
  const aNao = a.linha === NAO_INFORMADO;
  const bNao = b.linha === NAO_INFORMADO;
  if (aNao && !bNao) return 1;
  if (!aNao && bNao) return -1;
  return a.linha.localeCompare(b.linha, "pt-BR");
}

type Props = {
  title: string;
  subtitleBase: "global" | "sixMonths";
  periodos: string[];
  rowsByDimensao: Record<MergeadasPivotDimensao, MergeadaPivotRow[]>;
  filters: DashboardFilters;
  initialDimensao: MergeadasPivotDimensao;
  titleTooltip?: string;
};

export function MergeadasPivotTabela({
  title,
  subtitleBase,
  periodos,
  rowsByDimensao,
  filters,
  initialDimensao,
  titleTooltip,
}: Props) {
  const [dimensao, setDimensao] = useState(initialDimensao);
  const linhaHeader = mergeadasPivotDimensaoLabel(dimensao);
  const subtitle: ReactNode =
    subtitleBase === "global"
      ? `Contagem por ${linhaHeader.toLowerCase()} e mês do merge no período global`
      : `Contagem por ${linhaHeader.toLowerCase()} e mês do merge (últimos 6 meses)`;
  const linhas = buildPivotLinhas(rowsByDimensao[dimensao], periodos, comparePivotLinhas);
  const totaisPorPeriodo = pivotPeriodTotals(linhas, periodos);
  const totalGeral = totaisPorPeriodo.reduce((acc, v) => acc + v, 0);

  function pivotHref(opts: { linha?: string; periodo?: string }) {
    return buildMergeadasPivotIssuesHref(filters, {
      linha: opts.linha,
      periodo: opts.periodo,
      dimensao,
    });
  }

  return (
    <section className="overflow-visible rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <CardSectionHeader title={title} subtitle={subtitle} tooltip={titleTooltip} />

      <div className="mb-4">
        <MergeadasPivotDimensaoToggle selected={dimensao} onChange={setDimensao} />
      </div>

      {linhas.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500">
          Sem issues mergeadas no período exibido.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {linhaHeader}
                </th>
                {periodos.map((p) => (
                  <th
                    key={p}
                    className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {formatPeriodoLabel(p)}
                  </th>
                ))}
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {linhas.map((l) => (
                <tr key={l.linha} className="hover:bg-slate-50">
                  <td className="px-3 py-2 text-left text-slate-700">{l.linha}</td>
                  {periodos.map((p) => {
                    const count = l.cols.get(p) ?? 0;
                    const periodoLabel = formatPeriodoLabel(p);
                    return (
                      <td key={p} className="px-3 py-2 text-right text-slate-700">
                        <IssueCountLink
                          count={count}
                          href={pivotHref({ linha: l.linha, periodo: p })}
                          label={`${l.linha} — ${periodoLabel}`}
                        >
                          {formatNumber(count)}
                        </IssueCountLink>
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-right font-semibold text-slate-900">
                    <IssueCountLink
                      count={l.total}
                      href={pivotHref({ linha: l.linha })}
                      label={`${l.linha} — total`}
                    >
                      {formatNumber(l.total)}
                    </IssueCountLink>
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-semibold">
                <td className="px-3 py-2 text-left text-slate-900">Total</td>
                {totaisPorPeriodo.map((v, idx) => {
                  const p = periodos[idx];
                  return (
                    <td key={p} className="px-3 py-2 text-right text-slate-900">
                      <IssueCountLink
                        count={v}
                        href={pivotHref({ periodo: p })}
                        label={`Total — ${formatPeriodoLabel(p)}`}
                      >
                        {formatNumber(v)}
                      </IssueCountLink>
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-right text-slate-900">
                  <IssueCountLink
                    count={totalGeral}
                    href={pivotHref({})}
                    label="Total geral"
                  >
                    {formatNumber(totalGeral)}
                  </IssueCountLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
