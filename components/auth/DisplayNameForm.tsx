"use client";

import { type FormEvent, useState } from "react";

import { SupabaseGuard } from "@/components/auth/SupabaseGuard";
import { SystemFeedback } from "@/components/ui/SystemFeedback";

type DisplayNameFormProps = {
  initialFullName: string | null;
};

export function DisplayNameForm({ initialFullName }: DisplayNameFormProps) {
  const [fullName, setFullName] = useState(initialFullName ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName.trim() || null }),
      });
      const data = (await res.json()) as { error?: string; profile?: { full_name: string | null } };
      if (!res.ok) throw new Error(data.error ?? "Não foi possível atualizar o nome.");

      setFullName(data.profile?.full_name ?? "");
      setMessage("Nome de exibição atualizado.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar o nome.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SupabaseGuard>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Nome de exibição</h2>
          <p className="mt-1 text-xs text-slate-500">
            Este nome aparece em telas e relatórios do dashboard.
          </p>
        </div>

        <div>
          <label htmlFor="display-name" className="mb-1 block text-sm font-medium text-slate-700">
            Nome
          </label>
          <input
            id="display-name"
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-govbr-blue focus:outline-none"
          />
        </div>

        {error ? <SystemFeedback variant="danger" mode="inline" message={error} /> : null}

        {message ? <SystemFeedback variant="success" mode="inline" message={message} /> : null}

        <button
          type="submit"
          disabled={loading}
          className="br-button primary w-fit"
        >
          {loading ? "Salvando…" : "Atualizar nome"}
        </button>
      </form>
    </SupabaseGuard>
  );
}
