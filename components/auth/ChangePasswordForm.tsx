"use client";

import { type FormEvent, useState } from "react";

import { PasswordFields } from "@/components/auth/PasswordFields";
import { SupabaseGuard } from "@/components/auth/SupabaseGuard";
import { SystemFeedback } from "@/components/ui/SystemFeedback";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { validatePasswordPair } from "@/lib/auth/password";

export function ChangePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

      setPassword("");
      setConfirm("");
      setMessage("Sua senha foi alterada com sucesso.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível alterar a senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SupabaseGuard>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-slate-900">Alterar senha</h2>

        <PasswordFields
          password={password}
          confirm={confirm}
          onPasswordChange={setPassword}
          onConfirmChange={setConfirm}
          passwordId="new-password"
          confirmId="confirm-password"
        />

        {error ? (
          <SystemFeedback variant="danger" mode="inline" message={error} />
        ) : null}

        {message ? (
          <SystemFeedback variant="success" mode="inline" message={message} />
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="br-button primary w-fit"
        >
          {loading ? "Salvando…" : "Atualizar senha"}
        </button>
      </form>
    </SupabaseGuard>
  );
}
