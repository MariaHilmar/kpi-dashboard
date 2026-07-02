import {
  LEAD_TIME_OUTLIER_THRESHOLD_DAYS,
  type LeadTimeDistributionSummary,
} from "@/lib/dashboard/flow-charts";
import { formatDecimal, formatNumber } from "@/lib/format";

type FluxoLeadTimeDistribuicaoCardProps = {
  summary: LeadTimeDistributionSummary | null;
};

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-slate-900">{value}</dd>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function FluxoLeadTimeDistribuicaoCard({ summary }: FluxoLeadTimeDistribuicaoCardProps) {
  return (
    <section
      aria-label="Distribuição do lead time"
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-900">Distribuição do lead time</h3>
        <p className="text-sm text-slate-500">
          {summary
            ? `${formatNumber(summary.count)} issues fechadas no período`
            : "Issues fechadas no recorte selecionado"}
        </p>
      </div>

      {!summary ? (
        <div className="flex min-h-24 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500">
          Sem conclusões no período.
        </div>
      ) : (
        <>
          <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Mediana"
              value={summary.mediana != null ? `${formatDecimal(summary.mediana)} dias` : "—"}
              hint="Mesma base do KPI executivo"
            />
            <Metric
              label="P85"
              value={summary.p85 != null ? `${formatDecimal(summary.p85)} dias` : "—"}
              hint="85% concluídas até este prazo"
            />
            <Metric
              label="P95"
              value={summary.p95 != null ? `${formatDecimal(summary.p95)} dias` : "—"}
              hint="Cauda longa do período"
            />
            <Metric
              label={`Outliers (> ${LEAD_TIME_OUTLIER_THRESHOLD_DAYS} d)`}
              value={formatNumber(summary.outliersAcima90)}
              hint="Entregas muito acima do usual"
            />
          </dl>

          {summary.desvioPadrao != null ? (
            <p className="mt-3 text-xs text-slate-500">
              Desvio padrão: {formatDecimal(summary.desvioPadrao)} dias · Percentis calculados em TS
              (método contínuo, alinhado ao SQL)
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
