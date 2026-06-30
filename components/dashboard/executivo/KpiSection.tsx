import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { fetchKpis } from "@/lib/dashboard/fetchers";
import type { DashboardFilters } from "@/types/database";

type KpiSectionProps = {
  filters: DashboardFilters;
};

export async function KpiSection({ filters }: KpiSectionProps) {
  const kpis = await fetchKpis(filters);
  return <KpiGrid kpis={kpis} />;
}
