"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

import { SupabaseGuard } from "@/components/auth/SupabaseGuard";
import { SystemFeedback } from "@/components/ui/SystemFeedback";
import { createBrowserSupabase } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const supabase = createBrowserSupabase();
      const redirectTo = `${window.location.origin}/auth/callback?next=/redefinir-senha`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (resetError) throw resetError;

      setMessage(
        "Se existir uma conta com este e-mail, você receberá um link para redefinir a senha. Verifique também a pasta de spam.",
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível enviar o e-mail de recuperação.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SupabaseGuard>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
            E-mail da conta
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-govbr-blue focus:outline-none"
          />
        </div>

        {error ? <SystemFeedback variant="danger" mode="inline" message={error} /> : null}

        {message ? (
          <SystemFeedback
            variant="info"
            mode="message"
            title="E-mail enviado"
            message={message}
          />
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="br-button primary block"
        >
          {loading ? "Enviando…" : "Enviar link de recuperação"}
        </button>

        <p className="text-center text-sm text-slate-600">
          <Link href="/login" className="font-medium text-govbr-blue hover:underline">
            Voltar ao login
          </Link>
        </p>
      </form>
    </SupabaseGuard>
  );
}
