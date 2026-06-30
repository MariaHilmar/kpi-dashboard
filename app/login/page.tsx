import Link from "next/link";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/LoginForm";
import { AuthShell } from "@/components/auth/AuthShell";

export default function LoginPage() {
  return (
    <AuthShell
      title="Entrar"
      subtitle="Acesso ao painel de KPIs. Todos os usuários autenticados têm acesso completo ao dashboard."
      footer={
        <p className="text-center text-xs text-slate-500">
          <Link href="https://www.gov.br" className="text-govbr-blue hover:underline">
            gov.br
          </Link>
        </p>
      }
    >
      <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-slate-100" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
