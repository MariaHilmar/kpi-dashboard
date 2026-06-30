"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

import { SupabaseGuard } from "@/components/auth/SupabaseGuard";
import { SystemFeedback } from "@/components/ui/SystemFeedback";
import { createBrowserSupabase } from "@/lib/supabase/client";

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
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
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: nome.trim() || undefined } },
      });

      if (signUpError) throw signUpError;

      setMessage(
        "Conta criada. Se a confirmação por e-mail estiver ativa no Supabase, verifique sua caixa de entrada antes de entrar.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar a conta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SupabaseGuard>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="nome" className="mb-1 block text-sm font-medium text-slate-700">
            Nome (opcional)
          </label>
          <input
            id="nome"
            type="text"
            autoComplete="name"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-govbr-blue focus:outline-none"
          />
        </div>

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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-govbr-blue focus:outline-none"
          />
        </div>

        {error ? <SystemFeedback variant="danger" mode="inline" message={error} /> : null}

        {message ? (
          <SystemFeedback variant="success" mode="message" message={message} title="Conta criada" />
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="br-button primary block"
        >
          {loading ? "Aguarde…" : "Criar conta"}
        </button>

        <p className="text-center text-sm text-slate-600">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-govbr-blue hover:underline">
            Entrar
          </Link>
        </p>
      </form>
    </SupabaseGuard>
  );
}
