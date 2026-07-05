import { ImportarDadosPanel } from "@/components/dados/ImportarDadosPanel";
import { SetupBanner } from "@/components/dashboard/SetupBanner";
import { PageHeader } from "@/components/layout/PageHeader";
import { listMilestoneOptions } from "@/lib/dashboard/milestones";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default async function ImportarDadosPage() {
  if (!isSupabaseConfigured()) {
    return <SetupBanner />;
  }

  const milestones = await listMilestoneOptions();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Importar Dados"
        subtitle="Atualize story points e campos de relatório a partir da planilha do Planning Poker. Recomendamos validar antes de importar."
        titleTooltip="As issues precisam existir previamente no sistema (sincronizadas do GitLab). Use gitlab_repo + gitlab_iid para identificar cada linha."
      />

      <ImportarDadosPanel milestones={milestones} />
    </div>
  );
}
