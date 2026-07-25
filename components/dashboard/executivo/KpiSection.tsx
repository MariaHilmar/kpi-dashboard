import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { KPI_SECTION_SUBTITLE } from "@/lib/dashboard/executivo-chart-labels";
import { fetchKpis } from "@/lib/dashboard/fetchers";
import type { DashboardFilters } from "@/types/database";

type KpiSectionProps = {
  filters: DashboardFilters;
};

export async function KpiSection({ filters }: KpiSectionProps) {
  const kpis = await fetchKpis(filters);
  return (
    <section>
      <p className="mb-3 text-sm text-slate-500">{KPI_SECTION_SUBTITLE}</p>
      <KpiGrid kpis={kpis} />
    </section>
  );
}
