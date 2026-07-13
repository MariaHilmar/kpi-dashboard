"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

import { PasswordFields } from "@/components/auth/PasswordFields";
import { SupabaseGuard } from "@/components/auth/SupabaseGuard";
import { SystemFeedback } from "@/components/ui/SystemFeedback";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { validatePasswordPair } from "@/lib/auth/password";

type ResetPasswordFormProps = {
  /** Redireciona para / após sucesso (fluxo de recuperação por e-mail). */
  afterRecovery?: boolean;
};

export function ResetPasswordForm({ afterRecovery = true }: ResetPasswordFormProps) {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(configured);
  const [hasSession, setHasSession] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) return;

    const supabase = createBrowserSupabase();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setHasSession(Boolean(user));
      setCheckingSession(false);
    });
  }, [configured]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const validationError = validatePasswordPair(password, confirm);
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      const supabase = createBrowserSupabase();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      setMessage("Senha atualizada com sucesso.");

      if (afterRecovery) {
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1200);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar a senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SupabaseGuard>
      {checkingSession ? (
        <div className="h-24 animate-pulse rounded-lg bg-slate-100" aria-busy="true" />
      ) : !hasSession ? (
        <div className="flex flex-col gap-3">
          <SystemFeedback
            variant="warning"
            mode="message"
            title="Link expirado"
            message="O link de recuperação expirou ou a sessão não foi estabelecida. Solicite um novo e-mail."
          />
          <Link href="/recuperar-senha" className="font-medium text-govbr-blue hover:underline">
            Recuperar senha
          </Link>
          <Link href="/login" className="font-medium text-govbr-blue hover:underline">
            Voltar ao login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <PasswordFields
            password={password}
            confirm={confirm}
            onPasswordChange={setPassword}
            onConfirmChange={setConfirm}
          />

          {error ? <SystemFeedback variant="danger" mode="inline" message={error} /> : null}

          {message ? (
            <SystemFeedback variant="success" mode="message" message={message} />
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="br-button primary block"
          >
            {loading ? "Salvando…" : "Salvar nova senha"}
          </button>
        </form>
      )}
    </SupabaseGuard>
  );
}
