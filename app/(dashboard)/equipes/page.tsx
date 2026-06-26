import { BarChartCard } from "@/components/dashboard/BarChartCard";
import { SetupBanner } from "@/components/dashboard/SetupBanner";
import { PageHeader } from "@/components/layout/PageHeader";
import { TOP_LIMIT } from "@/lib/dashboard/constants";
import { type DashboardPageProps, getDashboardContext } from "@/lib/dashboard/page";
import { fetchAggregate } from "@/lib/dashboard/fetchers";

export const dynamic = "force-dynamic";

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
      />

      <BarChartCard title="Volume por Equipe" subtitle="Top 20 equipes" data={equipes} horizontal />

      <div className="grid gap-6 xl:grid-cols-2">
        <BarChartCard
          title="Top Desenvolvedores"
          subtitle="Top 12 (Git)"
          data={desenvolvedor}
          horizontal
        />
        <BarChartCard title="Merge em master" subtitle="Issues mergeadas (Git)" data={devMergeado} />
      </div>
    </div>
  );
}
