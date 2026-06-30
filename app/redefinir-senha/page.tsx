import Link from "next/link";
import { Suspense } from "react";

import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default function RedefinirSenhaPage() {
  return (
    <AuthShell
      title="Definir nova senha"
      subtitle="Escolha uma nova senha para concluir a recuperação da conta."
      footer={
        <p className="text-center text-sm text-slate-600">
          <Link href="/login" className="font-medium text-govbr-blue hover:underline">
            Voltar ao login
          </Link>
        </p>
      }
    >
      <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-slate-100" />}>
        <ResetPasswordForm afterRecovery />
      </Suspense>
    </AuthShell>
  );
}
