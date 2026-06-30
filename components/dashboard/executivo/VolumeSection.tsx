import { BarChartCard } from "@/components/dashboard/BarChartCard";
import { TOP_LIMIT } from "@/lib/dashboard/constants";
import { fetchAggregate } from "@/lib/dashboard/fetchers";
import type { DashboardFilters } from "@/types/database";

type VolumeSectionProps = {
  filters: DashboardFilters;
};

export async function VolumeSection({ filters }: VolumeSectionProps) {
  const [modulos, equipes] = await Promise.all([
    fetchAggregate("modulo", filters, { limit: TOP_LIMIT.modulo }),
    fetchAggregate("equipe", filters, { limit: TOP_LIMIT.equipe }),
  ]);

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <BarChartCard title="Módulos" subtitle="Volume por módulo (top 14)" data={modulos} horizontal />
      <BarChartCard title="Equipes" subtitle="Volume por equipe (top 14)" data={equipes} />
    </div>
  );
}
