import Link from "next/link";
import { Suspense } from "react";

import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function RecuperarSenhaPage() {
  return (
    <AuthShell
      title="Recuperar senha"
      subtitle="Informe o e-mail da sua conta. Enviaremos um link para definir uma nova senha."
      footer={
        <p className="text-center text-sm text-slate-600">
          Lembrou a senha?{" "}
          <Link href="/login" className="font-medium text-govbr-blue hover:underline">
            Voltar ao login
          </Link>
        </p>
      }
    >
      <Suspense fallback={<div className="h-32 animate-pulse rounded-lg bg-slate-100" />}>
        <ForgotPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
