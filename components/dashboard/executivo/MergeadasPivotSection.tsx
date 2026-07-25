import { DonutChartCard } from "@/components/dashboard/DonutChartCard";
import { MergeadasPivotTabela } from "@/components/dashboard/tables/MergeadasPivotTabela";
import { TODOS } from "@/lib/dashboard/constants";
import { mergeVolumeSubtitle } from "@/lib/dashboard/executivo-chart-labels";
import { EXECUTIVO_SECTION_TOOLTIPS } from "@/lib/dashboard/executivo-section-tooltips";
import { fetchMergeadasAggregate, fetchMergeadasPivot } from "@/lib/dashboard/fetchers";
import { lastMonthsKeys } from "@/lib/dashboard/mergeadas-format";
import { mergeadasSixMonthWindow } from "@/lib/dashboard/issuesLinks";
import type { DashboardFilters } from "@/types/database";

type Props = {
  filters: DashboardFilters;
};

export async function MergeadasPivotSection({ filters }: Props) {
  const [pivot, parceria, tipo, prioridades] = await Promise.all([
    fetchMergeadasPivot(filters),
    fetchMergeadasAggregate("parceria", filters),
    fetchMergeadasAggregate("tipo", filters),
    fetchMergeadasAggregate("prioridade", filters),
  ]);

  const porModulo = filters.modulo === TODOS;
  const periodos = lastMonthsKeys(6);
  const linhaHeader = porModulo ? "Módulo" : "Épico";
  const mergeWindow = mergeadasSixMonthWindow();
  const mergeDrilldown = {
    filters,
    ignoreSprintAndPeriod: true as const,
    extra: mergeWindow,
  };

  return (
    <div className="flex flex-col gap-6">
      <MergeadasPivotTabela
        linhaHeader={linhaHeader}
        subtitle={`Contagem por ${linhaHeader.toLowerCase()} e mês do merge (a partir da data atual)`}
        periodos={periodos}
        rows={pivot}
        filters={filters}
        porModulo={porModulo}
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
