import { DonutChartCard } from "@/components/dashboard/DonutChartCard";
import { MergeadasPivotTabela } from "@/components/dashboard/tables/MergeadasPivotTabela";
import { mergeVolumeSubtitle } from "@/lib/dashboard/executivo-chart-labels";
import { EXECUTIVO_SECTION_TOOLTIPS } from "@/lib/dashboard/executivo-section-tooltips";
import { fetchMergeadasAggregate, fetchMergeadasPivot } from "@/lib/dashboard/fetchers";
import { mergeadasSixMonthWindow } from "@/lib/dashboard/issuesLinks";
import {
  mergeadasPivotPeriodKeys,
  mergeadasPivotTableTitle,
  parseMergeadasPivotDimensao,
} from "@/lib/dashboard/mergeadas-pivot";
import type { DashboardSearchParams } from "@/lib/dashboard/page";
import type { DashboardFilters } from "@/types/database";

type Props = {
  filters: DashboardFilters;
  searchParams: DashboardSearchParams;
};

export async function MergeadasPivotSection({ filters, searchParams }: Props) {
  const initialDimensao = parseMergeadasPivotDimensao(searchParams.mergeadasPor);

  const [pivotModulo, pivotEpico, pivotParceria, parceria, tipo, prioridades] = await Promise.all([
    fetchMergeadasPivot(filters, "modulo"),
    fetchMergeadasPivot(filters, "epico"),
    fetchMergeadasPivot(filters, "parceria"),
    fetchMergeadasAggregate("parceria", filters),
    fetchMergeadasAggregate("tipo", filters),
    fetchMergeadasAggregate("prioridade", filters),
  ]);

  const periodos = mergeadasPivotPeriodKeys(filters);

  const mergeWindow = mergeadasSixMonthWindow();
  const mergeDrilldown = {
    filters,
    ignoreSprintAndPeriod: true as const,
    extra: mergeWindow,
  };

  return (
    <div className="flex flex-col gap-6">
      <MergeadasPivotTabela
        title={mergeadasPivotTableTitle(filters)}
        periodos={periodos}
        rowsByDimensao={{ modulo: pivotModulo, epico: pivotEpico, parceria: pivotParceria }}
        filters={filters}
        initialDimensao={initialDimensao}
        titleTooltip={EXECUTIVO_SECTION_TOOLTIPS.mergeadasPorPeriodo}
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <DonutChartCard
          title="Parceria"
          subtitle={mergeVolumeSubtitle("parceria")}
          titleTooltip={EXECUTIVO_SECTION_TOOLTIPS.mergeadasParceria}
          data={parceria}
          issuesDrilldown={{ ...mergeDrilldown, dimension: "parceria" }}
        />
        <DonutChartCard
          title="Tipo"
          subtitle={mergeVolumeSubtitle("tipo")}
          titleTooltip={EXECUTIVO_SECTION_TOOLTIPS.mergeadasTipo}
          data={tipo}
          issuesDrilldown={{ ...mergeDrilldown, dimension: "tipo" }}
        />
        <DonutChartCard
          title="Prioridade"
          subtitle={mergeVolumeSubtitle("prioridade")}
          titleTooltip={EXECUTIVO_SECTION_TOOLTIPS.mergeadasPrioridade}
          data={prioridades}
          issuesDrilldown={{ ...mergeDrilldown, dimension: "prioridade" }}
        />
      </div>
    </div>
  );
}
