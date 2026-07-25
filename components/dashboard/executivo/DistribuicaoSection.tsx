import { DonutChartCard } from "@/components/dashboard/DonutChartCard";

import { issuesVolumeSubtitle } from "@/lib/dashboard/executivo-chart-labels";
import { fetchAggregate } from "@/lib/dashboard/fetchers";

import { EXECUTIVO_SECTION_TOOLTIPS } from "@/lib/dashboard/executivo-section-tooltips";

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

      <DonutChartCard

        title="Status"

        subtitle={issuesVolumeSubtitle("status")}

        titleTooltip={EXECUTIVO_SECTION_TOOLTIPS.status}

        data={status}

        colorScheme="issue-status"

        issuesDrilldown={{ filters, dimension: "status" }}

      />

      <DonutChartCard

        title="Tipo"

        subtitle={issuesVolumeSubtitle("tipo")}

        titleTooltip={EXECUTIVO_SECTION_TOOLTIPS.tipo}

        data={tipo}

        issuesDrilldown={{ filters, dimension: "tipo" }}

      />

      <DonutChartCard

        title="Prioridade"

        subtitle={issuesVolumeSubtitle("prioridade")}

        titleTooltip={EXECUTIVO_SECTION_TOOLTIPS.prioridade}

        data={prioridades}

        issuesDrilldown={{ filters, dimension: "prioridade" }}

      />

    </div>

  );

}
