import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AnalistasHistoricoTable } from "@/components/analistas/AnalistasHistoricoTable";
import { HistoricoMesFilter } from "@/components/analistas/HistoricoMesFilter";
import { PageHeader } from "@/components/layout/PageHeader";
import { requireAdmin } from "@/lib/auth/profile";
import { listAnalistaRelatorios } from "@/lib/dashboard/analistas";
import type { DashboardPageProps } from "@/lib/dashboard/page";

export default async function AdminRelatoriosPage({ searchParams }: DashboardPageProps) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    redirect("/");
  }

  const sp = await searchParams;
  const anoMes = typeof sp.anoMes === "string" && sp.anoMes !== "" ? sp.anoMes : undefined;

  const relatorios = await listAnalistaRelatorios({ anoMes });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Relatórios de Analistas"
        subtitle="Histórico de relatórios mensais (rascunho e publicado). Apenas administradores visualizam todos os analistas."
      />

      <Suspense fallback={<div className="h-20 animate-pulse rounded-xl bg-white" />}>
        <HistoricoMesFilter />
      </Suspense>

      <AnalistasHistoricoTable rows={relatorios} />
    </div>
  );
}
