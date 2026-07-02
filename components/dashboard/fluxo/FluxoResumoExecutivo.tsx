import { KpiCard } from "@/components/dashboard/KpiCard";
import type { KpiTrend } from "@/lib/dashboard/flow-charts";
import type { FlowBottleneckRow, FlowWorkItemAgeRow } from "@/lib/dashboard/flow-report";
import { gitlabWorkItemUrlFromIssueKey, issueKeyToIid } from "@/lib/dashboard/gitlab-url";
import { formatDecimal, formatNumber } from "@/lib/format";

type FluxoResumoExecutivoProps = {
  concluidas: number;
  leadTimeMedio: number | null;
  leadTimeMediana: number | null;
  wipTotal: number;
  throughputMedio: number | null;
  throughputLabel: string;
  gargalo: FlowBottleneckRow | null;
  issueCritica: FlowWorkItemAgeRow | null;
  concluidasTrend?: KpiTrend;
  leadTimeMedianaTrend?: KpiTrend;
  wipTrend?: KpiTrend;
};

export function FluxoResumoExecutivo({
  concluidas,
  leadTimeMedio,
  leadTimeMediana,
  wipTotal,
  throughputMedio,
  throughputLabel,
  gargalo,
  issueCritica,
  concluidasTrend,
  leadTimeMedianaTrend,
  wipTrend,
}: FluxoResumoExecutivoProps) {
  const leadHint =
    leadTimeMedio != null
      ? `Média ${formatDecimal(leadTimeMedio)} dias · fechadas no período`
      : "Issues fechadas no período";

  const gargaloValue = gargalo
    ? `${gargalo.etapa} · ${formatNumber(gargalo.quantidade_atual)} issues · média ${formatDecimal(gargalo.idade_media_dias ?? 0)} d`
    : "—";
  const gargaloHint = gargalo?.observacao ?? (gargalo ? undefined : "Sem acúmulo relevante");

  const criticalUrl = issueCritica ? gitlabWorkItemUrlFromIssueKey(issueCritica.issue_key) : null;
  const criticalValue = issueCritica
    ? `${issueKeyToIid(issueCritica.issue_key)} · ${issueCritica.etapa_atual} · ${formatNumber(issueCritica.dias_em_andamento)} d`
    : "—";
  const criticalHint = issueCritica?.titulo
    ? issueCritica.titulo.length > 60
      ? `${issueCritica.titulo.slice(0, 57)}…`
      : issueCritica.titulo
    : "Nenhuma issue aberta no recorte";

  return (
    <section aria-label="Resumo executivo do fluxo">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">Resumo executivo</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Issues concluídas"
          value={formatNumber(concluidas)}
          hint="Total no período selecionado"
          trend={concluidasTrend}
          accent="success"
        />
        <KpiCard
          label="Mediana do lead time"
          value={leadTimeMediana != null ? `${formatDecimal(leadTimeMediana)} dias` : "—"}
          hint={leadHint}
          trend={leadTimeMedianaTrend}
        />
        <KpiCard
          label="WIP atual"
          value={formatNumber(wipTotal)}
          hint="A Fazer até Homologação"
          trend={wipTrend}
          accent="info"
        />
        <KpiCard
          label={`Throughput médio (${throughputLabel})`}
          value={throughputMedio != null ? formatDecimal(throughputMedio, 1) : "—"}
          hint="Média por bucket no gráfico abaixo"
        />
        <KpiCard
          label="Gargalo provável"
          value={gargaloValue}
          hint={gargaloHint}
          accent={gargalo?.observacao ? "warning" : "default"}
        />
        <KpiCard
          label="Issue mais antiga"
          value={criticalValue}
          hint={criticalHint}
          externalHref={criticalUrl ?? undefined}
          accent={
            issueCritica && issueCritica.dias_em_andamento > 90 ? "warning" : "default"
          }
        />
      </div>
    </section>
  );
}
