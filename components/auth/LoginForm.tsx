"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";

import { SupabaseGuard } from "@/components/auth/SupabaseGuard";
import { SystemFeedback } from "@/components/ui/SystemFeedback";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { isSignupAllowed } from "@/lib/supabase/env";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/";
  const inactiveError = searchParams.get("error") === "inactive";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserSupabase();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      router.push(nextPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SupabaseGuard>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
            E-mail
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

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
            Senha
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-govbr-blue focus:outline-none"
          />
          <p className="mt-1.5 text-right text-xs">
            <Link href="/recuperar-senha" className="text-govbr-blue hover:underline">
              Esqueci minha senha
            </Link>
          </p>
        </div>

        {inactiveError ? (
          <SystemFeedback
            variant="warning"
            mode="message"
            title="Conta inativa"
            message="Sua conta está inativa. Entre em contato com um administrador."
          />
        ) : null}

        {error ? <SystemFeedback variant="danger" mode="inline" message={error} /> : null}

        <button
          type="submit"
          disabled={loading}
          className="br-button primary block"
        >
          {loading ? "Aguarde…" : "Entrar"}
        </button>

        <p className="text-center text-sm text-slate-600">
          {isSignupAllowed() ? (
            <>
              Não tem conta?{" "}
              <Link href="/cadastro" className="font-medium text-govbr-blue hover:underline">
                Cadastre-se
              </Link>
            </>
          ) : (
            <span className="text-xs text-slate-500">Contas criadas pelo administrador.</span>
          )}
        </p>
      </form>
    </SupabaseGuard>
  );
}
