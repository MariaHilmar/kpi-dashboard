import { BarChartCard } from "@/components/dashboard/BarChartCard";
import { DonutChartCard } from "@/components/dashboard/DonutChartCard";
import { fetchAggregate } from "@/lib/dashboard/fetchers";
import type { DashboardFilters } from "@/types/database";

type DistribuicaoSectionProps = {
  filters: DashboardFilters;
};

export async function DistribuicaoSection({ filters }: DistribuicaoSectionProps) {
  const [status, tipo, prioridades] = await Promise.all([
    fetchAggregate("status", filters),
    fetchAggregate("tipo", filters),
    fetchAggregate("prioridade", filters),
  ]);

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <DonutChartCard title="Status" subtitle="Distribuição por status" data={status} />
      <DonutChartCard title="Tipo" subtitle="Distribuição por tipo" data={tipo} />
      <BarChartCard title="Prioridade" subtitle="Distribuição por prioridade" data={prioridades} />
    </div>
  );
}
