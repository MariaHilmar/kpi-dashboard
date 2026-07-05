import { BarChartCard } from "@/components/dashboard/BarChartCard";
import { SetupBanner } from "@/components/dashboard/SetupBanner";
import { KpisPorTipoTabela } from "@/components/dashboard/tables/KpisPorTipoTabela";
import { PageHeader } from "@/components/layout/PageHeader";
import { TOP_LIMIT } from "@/lib/dashboard/constants";
import { DETALHAMENTO_SECTION_TOOLTIPS } from "@/lib/dashboard/detalhamento-section-tooltips";
import { type DashboardPageProps, getDashboardContext } from "@/lib/dashboard/page";
import {
  fetchAggregate,
  fetchKpisPorTipo,
  fetchLeadTimePorModulo,
} from "@/lib/dashboard/fetchers";
import type { ChartPoint } from "@/types/database";

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
        titleTooltip={DETALHAMENTO_SECTION_TOOLTIPS.page}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <BarChartCard
          title="Parcerias"
          subtitle="Volume por parceria"
          titleTooltip={DETALHAMENTO_SECTION_TOOLTIPS.parcerias}
          data={parceria}
          issuesDrilldown={{ filters, dimension: "parceria" }}
        />
        <BarChartCard
          title="Issues por Módulo"
          subtitle="Volume por módulo (top 14)"
          titleTooltip={DETALHAMENTO_SECTION_TOOLTIPS.modulos}
          data={modulos}
          horizontal
          issuesDrilldown={{ filters, dimension: "modulo" }}
        />
        <BarChartCard
          title="Área Funcional"
          subtitle="Top 14 áreas"
          titleTooltip={DETALHAMENTO_SECTION_TOOLTIPS.areaFuncional}
          data={areaFuncional}
          issuesDrilldown={{ filters, dimension: "area_funcional" }}
        />
        <BarChartCard
          title="Categoria Funcional"
          subtitle="Core / Compliance / Finance / Platform / Operations"
          titleTooltip={DETALHAMENTO_SECTION_TOOLTIPS.categoriaFuncional}
          data={categoria}
        />
        <BarChartCard
          title="Lead time médio por módulo"
          subtitle="Top 15 módulos"
          titleTooltip={DETALHAMENTO_SECTION_TOOLTIPS.leadTimePorModulo}
          data={leadTimePorModulo.map<ChartPoint>((row) => ({
            label: row.modulo,
            quantidade: Number(row.lead_medio ?? 0),
          }))}
          horizontal
        />
      </div>

      <KpisPorTipoTabela filters={filters} rows={kpisPorTipo} />
    </div>
  );
}
