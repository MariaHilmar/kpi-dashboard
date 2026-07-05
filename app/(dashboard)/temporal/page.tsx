import { FluxoMensalCard } from "@/components/dashboard/FluxoMensalCard";
import { SetupBanner } from "@/components/dashboard/SetupBanner";
import { PageHeader } from "@/components/layout/PageHeader";
import { fetchFluxoMensal } from "@/lib/dashboard/fetchers";
import { type DashboardPageProps, getDashboardContext } from "@/lib/dashboard/page";
import { TEMPORAL_SECTION_TOOLTIPS } from "@/lib/dashboard/temporal-section-tooltips";

export default async function TemporalPage({ searchParams }: DashboardPageProps) {
  const { configured, filters } = await getDashboardContext(searchParams);
  if (!configured) {
    return <SetupBanner />;
  }

  const fluxoMensal = await fetchFluxoMensal(filters);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Análise Temporal"
        subtitle="Evolução de criação, fechamento e backlog líquido ao longo dos meses."
        titleTooltip={TEMPORAL_SECTION_TOOLTIPS.page}
      />

      <FluxoMensalCard
        title="Criados × Fechados"
        subtitle="Volume mensal de issues"
        titleTooltip={TEMPORAL_SECTION_TOOLTIPS.criadosFechados}
        data={fluxoMensal}
      />

      <FluxoMensalCard
        title="Backlog líquido acumulado"
        subtitle="Diferença entre criados e fechados por mês"
        titleTooltip={TEMPORAL_SECTION_TOOLTIPS.backlogLiquido}
        data={fluxoMensal}
      />
    </div>
  );
}
