import { KpiCard } from "@/components/dashboard/KpiCard";
import { CardSectionHeader } from "@/components/dashboard/CardSectionHeader";
import type { KpiTrend } from "@/lib/dashboard/flow-charts";
import type { FlowBottleneckRow, FlowWorkItemAgeRow } from "@/lib/dashboard/flow-report";
import { gitlabWorkItemUrlFromIssueKey, issueKeyToIid } from "@/lib/dashboard/gitlab-url";
import { FLUXO_SECTION_TOOLTIPS } from "@/lib/dashboard/fluxo-section-tooltips";
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
  concluidasIssuesHref?: string | null;
  wipIssuesHref?: string | null;
};

function formatCriticalHint(titulo: string | null | undefined): string {
  if (!titulo) return "Nenhuma issue aberta no recorte";
  if (titulo.length > 60) return `${titulo.slice(0, 57)}…`;
  return titulo;
}

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
  concluidasIssuesHref,
  wipIssuesHref,
}: Readonly<FluxoResumoExecutivoProps>) {
  const leadHint =
    leadTimeMedio === null
      ? "Issues fechadas no período"
      : `Média ${formatDecimal(leadTimeMedio)} dias · fechadas no período`;

  const gargaloValue = gargalo
    ? `${gargalo.etapa} · ${formatNumber(gargalo.quantidade_atual)} issues · média ${formatDecimal(gargalo.idade_media_dias ?? 0)} d`
    : "—";
  const gargaloHint = gargalo?.observacao ?? (gargalo ? undefined : "Sem acúmulo relevante");

  const criticalUrl = issueCritica ? gitlabWorkItemUrlFromIssueKey(issueCritica.issue_key) : null;
  const criticalValue = issueCritica
    ? `${issueKeyToIid(issueCritica.issue_key)} · ${issueCritica.etapa_atual} · ${formatNumber(issueCritica.dias_em_andamento)} d`
    : "—";
  const criticalHint = formatCriticalHint(issueCritica?.titulo);

  return (
    <section aria-label="Resumo executivo do fluxo">
      <CardSectionHeader
        title="Resumo executivo"
        titleClassName="text-sm font-semibold text-slate-900"
        className="mb-3"
        tooltip={FLUXO_SECTION_TOOLTIPS.resumoExecutivo}
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Issues concluídas"
          value={formatNumber(concluidas)}
          hint="Total no período selecionado"
          tooltip={FLUXO_SECTION_TOOLTIPS.concluidas}
          trend={concluidasTrend}
          accent="success"
          issuesHref={concluidasIssuesHref}
          issueCount={concluidas}
        />
        <KpiCard
          label="Mediana do lead time"
          value={leadTimeMediana != null ? `${formatDecimal(leadTimeMediana)} dias` : "—"}
          hint={leadHint}
          tooltip={FLUXO_SECTION_TOOLTIPS.leadTimeMediana}
          trend={leadTimeMedianaTrend}
        />
        <KpiCard
          label="WIP atual (Trabalho em Progresso)"
          value={formatNumber(wipTotal)}
          hint="A Fazer até Homologação"
          tooltip={FLUXO_SECTION_TOOLTIPS.wip}
          trend={wipTrend}
          accent="info"
          issuesHref={wipIssuesHref}
          issueCount={wipTotal}
        />
        <KpiCard
          label={`Throughput médio (${throughputLabel})`}
          value={throughputMedio != null ? formatDecimal(throughputMedio, 1) : "—"}
          hint="Média por bucket no gráfico abaixo"
          tooltip={
            throughputLabel === "mensal"
              ? FLUXO_SECTION_TOOLTIPS.throughputMensal
              : FLUXO_SECTION_TOOLTIPS.throughputSemanal
          }
        />
        <KpiCard
          label="Gargalo provável"
          value={gargaloValue}
          hint={gargaloHint}
          tooltip={FLUXO_SECTION_TOOLTIPS.gargalo}
          accent={gargalo?.observacao ? "warning" : "default"}
        />
        <KpiCard
          label="Issue mais antiga"
          value={criticalValue}
          hint={criticalHint}
          tooltip={FLUXO_SECTION_TOOLTIPS.issueMaisAntiga}
          externalHref={criticalUrl ?? undefined}
          accent={
            issueCritica && issueCritica.dias_em_andamento > 90 ? "warning" : "default"
          }
        />
      </div>
    </section>
  );
}
