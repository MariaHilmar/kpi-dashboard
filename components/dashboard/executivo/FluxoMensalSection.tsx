import { FluxoMensalCard } from "@/components/dashboard/FluxoMensalCard";
import { FLUXO_MENSAL_ISSUES_SUBTITLE } from "@/lib/dashboard/executivo-chart-labels";
import { EXECUTIVO_SECTION_TOOLTIPS } from "@/lib/dashboard/executivo-section-tooltips";
import { fetchFluxoMensal } from "@/lib/dashboard/fetchers";
import type { DashboardFilters } from "@/types/database";

type FluxoMensalSectionProps = {
  filters: DashboardFilters;
};

export async function FluxoMensalSection({ filters }: FluxoMensalSectionProps) {
  const fluxoMensal = await fetchFluxoMensal(filters);

  return (
    <FluxoMensalCard
      title="Evolução mensal"
      subtitle={FLUXO_MENSAL_ISSUES_SUBTITLE}
      titleTooltip={EXECUTIVO_SECTION_TOOLTIPS.evolucaoMensal}
      data={fluxoMensal}
    />
  );
}
