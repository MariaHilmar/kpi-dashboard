import { BarChartCard } from "@/components/dashboard/BarChartCard";
import { SetupBanner } from "@/components/dashboard/SetupBanner";
import { PageHeader } from "@/components/layout/PageHeader";
import { TOP_LIMIT } from "@/lib/dashboard/constants";
import { EQUIPES_SECTION_TOOLTIPS } from "@/lib/dashboard/equipes-section-tooltips";
import { type DashboardPageProps, getDashboardContext } from "@/lib/dashboard/page";
import { fetchAggregate } from "@/lib/dashboard/fetchers";

export default async function EquipesPage({ searchParams }: DashboardPageProps) {
  const { configured, filters } = await getDashboardContext(searchParams);
  if (!configured) {
    return <SetupBanner />;
  }

  const [equipes, desenvolvedor, devMergeado] = await Promise.all([
    fetchAggregate("equipe", filters, { limit: TOP_LIMIT.equipeWide }),
    fetchAggregate("desenvolvedor", filters, { limit: TOP_LIMIT.desenvolvedor }),
    fetchAggregate("dev_mergeado", filters),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Equipes & Desenvolvedores"
        subtitle="Volume por equipe, top desenvolvedores e issues mergeadas em master (Git)."
        titleTooltip={EQUIPES_SECTION_TOOLTIPS.page}
      />

      <BarChartCard
        title="Volume por Equipe"
        subtitle="Top 20 equipes"
        titleTooltip={EQUIPES_SECTION_TOOLTIPS.volumePorEquipe}
        data={equipes}
        horizontal
        issuesDrilldown={{ filters, dimension: "equipe" }}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <BarChartCard
          title="Top Desenvolvedores"
          subtitle="Top 12 (Git)"
          titleTooltip={EQUIPES_SECTION_TOOLTIPS.topDesenvolvedores}
          data={desenvolvedor}
          horizontal
        />
        <BarChartCard
          title="Merge em master"
          subtitle="Issues mergeadas (Git)"
          titleTooltip={EQUIPES_SECTION_TOOLTIPS.mergeEmMaster}
          data={devMergeado}
        />
      </div>
    </div>
  );
}
