import { redirect } from "next/navigation";

import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { DisplayNameForm } from "@/components/auth/DisplayNameForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { getCurrentProfile } from "@/lib/auth/profile";
import { getSessionUser } from "@/lib/supabase/session";

export default async function ContaPage() {
  const user = await getSessionUser();

  if (!user?.email) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Minha conta"
        subtitle="Gerencie seu nome de exibição e senha de acesso ao dashboard."
      />

      <div className="max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-8">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <p className="text-slate-500">Conta conectada</p>
            <p className="font-medium text-slate-900">{user.email}</p>
          </div>

          <DisplayNameForm initialFullName={profile?.full_name ?? null} />
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
