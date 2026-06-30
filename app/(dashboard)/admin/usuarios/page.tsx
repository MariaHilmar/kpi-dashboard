import { redirect } from "next/navigation";

import { UsersManager } from "@/components/admin/UsersManager";
import { PageHeader } from "@/components/layout/PageHeader";
import { requireAdmin } from "@/lib/auth/profile";

export default async function AdminUsuariosPage() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    redirect("/");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Usuários"
        subtitle="Gerencie contas de acesso ao dashboard. Apenas administradores podem incluir, editar, ativar ou inativar usuários."
      />
      <UsersManager />
    </div>
  );
}
