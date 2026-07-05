import { FluxoMensalCard } from "@/components/dashboard/FluxoMensalCard";
import { fetchFluxoMensal } from "@/lib/dashboard/fetchers";
import { EXECUTIVO_SECTION_TOOLTIPS } from "@/lib/dashboard/executivo-section-tooltips";
import type { DashboardFilters } from "@/types/database";

type FluxoMensalSectionProps = {
  filters: DashboardFilters;
};

export async function FluxoMensalSection({ filters }: FluxoMensalSectionProps) {
  const fluxoMensal = await fetchFluxoMensal(filters);
  return (
    <FluxoMensalCard
      title="Evolução mensal"
      subtitle="Criados × Fechados × Backlog líquido"
      titleTooltip={EXECUTIVO_SECTION_TOOLTIPS.evolucaoMensal}
      data={fluxoMensal}
    />
  );
}
