import { BarChartCard } from "@/components/dashboard/BarChartCard";
import { SetupBanner } from "@/components/dashboard/SetupBanner";
import { KpisPorTipoTabela } from "@/components/dashboard/tables/KpisPorTipoTabela";
import { PageHeader } from "@/components/layout/PageHeader";
import { TOP_LIMIT } from "@/lib/dashboard/constants";
import { type DashboardPageProps, getDashboardContext } from "@/lib/dashboard/page";
import {
  fetchAggregate,
  fetchKpisPorTipo,
  fetchLeadTimePorModulo,
} from "@/lib/dashboard/fetchers";
import type { ChartPoint } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function DetalhamentoPage({ searchParams }: DashboardPageProps) {
  const { configured, filters } = await getDashboardContext(searchParams);
  if (!configured) {
    return <SetupBanner />;
  }

  const [parceria, modulos, areaFuncional, categoria, leadTimePorModulo, kpisPorTipo] =
    await Promise.all([
      fetchAggregate("parceria", filters),
      fetchAggregate("modulo", filters, { limit: TOP_LIMIT.modulo }),
      fetchAggregate("area_funcional", filters, { limit: TOP_LIMIT.area }),
      fetchAggregate("categoria", filters),
      fetchLeadTimePorModulo(filters),
      fetchKpisPorTipo(filters),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Detalhamento"
        subtitle="Quebras por parceria, repositório, área funcional, categoria e lead time por módulo."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <BarChartCard title="Parcerias" subtitle="Volume por parceria" data={parceria} />
        <BarChartCard title="Issues por Módulo" subtitle="Volume por módulo (top 14)" data={modulos} horizontal />
        <BarChartCard title="Área Funcional" subtitle="Top 14 áreas" data={areaFuncional} />
        <BarChartCard
          title="Categoria Funcional"
          subtitle="Core / Compliance / Finance / Platform / Operations"
          data={categoria}
        />
        <BarChartCard
          title="Lead time médio por módulo"
          subtitle="Top 15 módulos"
          data={leadTimePorModulo.map<ChartPoint>((row) => ({
            label: row.modulo,
            quantidade: Number(row.lead_medio ?? 0),
          }))}
          horizontal
        />
      </div>

      <KpisPorTipoTabela rows={kpisPorTipo} />
    </div>
  );
}
