import type { FlowDataQualitySummary } from "@/lib/dashboard/flow-charts";
import { formatNumber, formatPercent } from "@/lib/format";

type FluxoDataQualityFooterProps = {
  summary: FlowDataQualitySummary | null;
};

export function FluxoDataQualityFooter({ summary }: FluxoDataQualityFooterProps) {
  if (!summary) return null;

  return (
    <footer
      aria-label="Qualidade do histórico Kanban no recorte"
      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-medium text-slate-900">Cobertura do histórico:</span>{" "}
          {summary.headline}
          <span className="text-slate-500">
            {" "}
            · {formatNumber(summary.totalIssues)} issues no recorte (mesmo escopo do CFD)
          </span>
        </p>

        <details className="text-xs text-slate-600">
          <summary className="cursor-pointer font-medium text-slate-700 hover:text-slate-900">
            Como classificamos
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-4 leading-relaxed">
            <li>
              <strong>Histórico real ({formatPercent(summary.pctEventosReais)}):</strong>{" "}
              {formatNumber(summary.comEventos)} issues com{" "}
              <code className="text-[11px]">issue_status_events</code> (transições GitLab).
            </li>
            <li>
              <strong>Snapshot ({formatPercent(summary.pctSnapshotApenas)}):</strong>{" "}
              {formatNumber(summary.comSnapshotApenas)} issues sem eventos, com foto diária em{" "}
              <code className="text-[11px]">issue_status_snapshots</code> no período.
            </li>
            <li>
              <strong>Proxy ({formatPercent(summary.pctProxy)}):</strong>{" "}
              {formatNumber(summary.comProxy)} issues reconstruídas pelo status atual entre criação
              e fechamento.
            </li>
          </ul>
          <p className="mt-2 text-slate-500">
            Prioridade igual ao CFD: eventos → snapshot → proxy. Não confundir com conformidade de
            campos em <strong>/qualidade</strong> (módulo, título, etc.).
          </p>
        </details>
      </div>
    </footer>
  );
}
