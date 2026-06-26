import { BarChartCard } from "@/components/dashboard/BarChartCard";
import { DonutChartCard } from "@/components/dashboard/DonutChartCard";
import { FluxoMensalCard } from "@/components/dashboard/FluxoMensalCard";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { SetupBanner } from "@/components/dashboard/SetupBanner";
import { PageHeader } from "@/components/layout/PageHeader";
import { TOP_LIMIT } from "@/lib/dashboard/constants";
import { type DashboardPageProps, getDashboardContext } from "@/lib/dashboard/page";
import { fetchAggregate, fetchFluxoMensal, fetchKpis } from "@/lib/dashboard/fetchers";

export const dynamic = "force-dynamic";

export default async function ExecutivoPage({ searchParams }: DashboardPageProps) {
  const { configured, filters } = await getDashboardContext(searchParams);
  if (!configured) {
    return <SetupBanner message="Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local" />;
  }

  const [kpis, fluxoMensal, status, tipo, prioridades, modulos, equipes] = await Promise.all([
    fetchKpis(filters),
    fetchFluxoMensal(filters),
    fetchAggregate("status", filters),
    fetchAggregate("tipo", filters),
    fetchAggregate("prioridade", filters),
    fetchAggregate("modulo", filters, { limit: TOP_LIMIT.modulo }),
    fetchAggregate("equipe", filters, { limit: TOP_LIMIT.equipe }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard Executivo"
        subtitle="Visão consolidada de KPIs, evolução mensal e distribuição por status, tipo e prioridade."
      />

      <KpiGrid kpis={kpis} />

      <FluxoMensalCard
        title="Evolução mensal"
        subtitle="Criados × Fechados × Backlog líquido"
        data={fluxoMensal}
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <DonutChartCard title="Status" subtitle="Distribuição por status" data={status} />
        <DonutChartCard title="Tipo" subtitle="Distribuição por tipo" data={tipo} />
        <BarChartCard title="Prioridade" subtitle="Distribuição por prioridade" data={prioridades} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <BarChartCard title="Módulos" subtitle="Volume por módulo (top 14)" data={modulos} horizontal />
        <BarChartCard title="Equipes" subtitle="Volume por equipe (top 14)" data={equipes} />
      </div>
    </div>
  );
}
