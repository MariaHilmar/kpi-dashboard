import { BarChartCard } from "@/components/dashboard/BarChartCard";
import { KpisPorTipoTabela } from "@/components/dashboard/tables/KpisPorTipoTabela";
import { TOP_LIMIT } from "@/lib/dashboard/constants";
import { DETALHAMENTO_SECTION_TOOLTIPS } from "@/lib/dashboard/detalhamento-section-tooltips";
import { issuesVolumeSubtitle } from "@/lib/dashboard/executivo-chart-labels";
import { EXECUTIVO_SECTION_TOOLTIPS } from "@/lib/dashboard/executivo-section-tooltips";
import {
  fetchAggregate,
  fetchKpisPorTipo,
  fetchLeadTimePorModulo,
} from "@/lib/dashboard/fetchers";
import type { ChartPoint, DashboardFilters } from "@/types/database";

type DetalhamentoSectionProps = {
  filters: DashboardFilters;
};

export async function DetalhamentoSection({ filters }: DetalhamentoSectionProps) {
  const [parceria, modulos, areaFuncional, equipes, leadTimePorModulo, kpisPorTipo] =
    await Promise.all([
      fetchAggregate("parceria", filters),
      fetchAggregate("modulo", filters, { limit: TOP_LIMIT.modulo }),
      fetchAggregate("area_funcional", filters, { limit: TOP_LIMIT.area }),
      fetchAggregate("equipe", filters, { limit: TOP_LIMIT.equipe }),
      fetchLeadTimePorModulo(filters),
      fetchKpisPorTipo(filters),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <BarChartCard
          title="Parcerias"
          subtitle={issuesVolumeSubtitle("parceria")}
          titleTooltip={DETALHAMENTO_SECTION_TOOLTIPS.parcerias}
          data={parceria}
          issuesDrilldown={{ filters, dimension: "parceria" }}
        />
        <BarChartCard
          title="Equipes"
          subtitle={issuesVolumeSubtitle("equipe", "top 14")}
          titleTooltip={EXECUTIVO_SECTION_TOOLTIPS.equipes}
          data={equipes}
          issuesDrilldown={{ filters, dimension: "equipe" }}
        />
        <BarChartCard
          title="Equipes"
          subtitle={issuesVolumeSubtitle("equipe", "top 14")}
          titleTooltip={EXECUTIVO_SECTION_TOOLTIPS.equipes}
          data={equipes}
          issuesDrilldown={{ filters, dimension: "equipe" }}
        />
        <BarChartCard
          title="Área Funcional"
          subtitle={issuesVolumeSubtitle("área funcional", "top 14")}
          titleTooltip={DETALHAMENTO_SECTION_TOOLTIPS.areaFuncional}
          data={areaFuncional}
          issuesDrilldown={{ filters, dimension: "area_funcional" }}
        />
        <BarChartCard
          title="Módulos"
          subtitle={issuesVolumeSubtitle("módulo", "top 14")}
          titleTooltip={EXECUTIVO_SECTION_TOOLTIPS.modulos}
          data={modulos}
          horizontal
          issuesDrilldown={{ filters, dimension: "modulo" }}
        />
        <BarChartCard
          title="Lead time médio por módulo"
          subtitle="Lead time médio das issues fechadas por módulo (top 15)"
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
