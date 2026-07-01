import { AlertasResumo } from "@/components/dashboard/AlertasResumo";
import { SetupBanner } from "@/components/dashboard/SetupBanner";
import { AlertasPorModuloTabela } from "@/components/dashboard/tables/AlertasPorModuloTabela";
import { FaixaIdadeTabela } from "@/components/dashboard/tables/FaixaIdadeTabela";
import { TopLeadTimesTabela } from "@/components/dashboard/tables/TopLeadTimesTabela";
import { PageHeader } from "@/components/layout/PageHeader";
import { type DashboardPageProps, getDashboardContext } from "@/lib/dashboard/page";
import {
  fetchAlertasPorModulo,
  fetchAlertasResumo,
  fetchFaixaIdade,
  fetchTopLeadTimes,
} from "@/lib/dashboard/fetchers";

export const dynamic = "force-dynamic";

export default async function AlertasPage({ searchParams }: DashboardPageProps) {
  const { configured, filters } = await getDashboardContext(searchParams);
  if (!configured) {
    return <SetupBanner />;
  }

  const [resumo, semEpico, semParceria, faixaIdade, topLeadTimes] = await Promise.all([
    fetchAlertasResumo(filters),
    fetchAlertasPorModulo("sem_epico", filters),
    fetchAlertasPorModulo("sem_parceria", filters),
    fetchFaixaIdade(filters),
    fetchTopLeadTimes(filters),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Alertas"
        subtitle="Issues abertas sem épico/parceria, distribuição por idade e maiores lead times — respeitam os filtros globais."
      />

      <AlertasResumo data={resumo} filters={filters} />

      <div className="grid gap-6 xl:grid-cols-2">
        <AlertasPorModuloTabela
          title="Issues abertas sem Épico — por Módulo"
          dimensao="sem_epico"
          filters={filters}
          rows={semEpico}
        />
        <AlertasPorModuloTabela
          title="Issues abertas sem Parceria — por Módulo"
          dimensao="sem_parceria"
          filters={filters}
          rows={semParceria}
        />
      </div>

      <FaixaIdadeTabela filters={filters} rows={faixaIdade} />

      <TopLeadTimesTabela rows={topLeadTimes} />
    </div>
  );
}
