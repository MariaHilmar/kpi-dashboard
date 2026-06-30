import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { SignupForm } from "@/components/auth/SignupForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { isSignupAllowed } from "@/lib/supabase/env";

export default function CadastroPage() {
  if (!isSignupAllowed()) {
    redirect("/login");
  }

  return (
    <AuthShell
      title="Criar conta"
      subtitle="Cadastro de usuário para acesso ao dashboard. Inicialmente, todos os perfis têm as mesmas permissões."
      footer={
        <p className="text-center text-sm text-slate-600">
          <Link href="/login" className="font-medium text-govbr-blue hover:underline">
            Voltar ao login
          </Link>
        </p>
      }
    >
      <Suspense fallback={<div className="h-48 animate-pulse rounded-lg bg-slate-100" />}>
        <SignupForm />
      </Suspense>
    </AuthShell>
  );
}
