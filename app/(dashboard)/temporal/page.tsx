import { FluxoMensalCard } from "@/components/dashboard/FluxoMensalCard";
import { SetupBanner } from "@/components/dashboard/SetupBanner";
import { PageHeader } from "@/components/layout/PageHeader";
import { type DashboardPageProps, getDashboardContext } from "@/lib/dashboard/page";
import { fetchFluxoMensal } from "@/lib/dashboard/fetchers";

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
      />

      <FluxoMensalCard
        title="Criados × Fechados"
        subtitle="Volume mensal de issues"
        data={fluxoMensal}
      />

      <FluxoMensalCard
        title="Backlog líquido acumulado"
        subtitle="Diferença entre criados e fechados por mês"
        data={fluxoMensal}
      />
    </div>
  );
}
