"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { SystemFeedback } from "@/components/ui/SystemFeedback";
import type { AnalistaRelatorioStatus } from "@/types/analistas";

type Props = {
  anoMes: string;
  sprint: string;
  initialValue: string;
  initialStatus: AnalistaRelatorioStatus;
  updatedAt?: string | null;
  readOnly?: boolean;
};

export function OutrasAtividadesEditor({
  anoMes,
  sprint,
  initialValue,
  initialStatus,
  updatedAt,
  readOnly = false,
}: Props) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [status, setStatus] = useState<AnalistaRelatorioStatus>(initialStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function save(nextStatus: AnalistaRelatorioStatus) {
    setMessage(null);
    setError(null);

    const response = await fetch("/api/analistas/relatorio", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        anoMes,
        sprint,
        outrasAtividades: value,
        status: nextStatus,
      }),
    });

    const payload = (await response.json()) as { error?: string; relatorio?: { status: AnalistaRelatorioStatus } };

    if (!response.ok) {
      setError(payload.error ?? "Não foi possível salvar.");
      return;
    }

    setStatus(payload.relatorio?.status ?? nextStatus);
    setMessage(nextStatus === "publicado" ? "Relatório publicado com sucesso." : "Rascunho salvo.");
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-800">
            Outras atividades{readOnly ? " (somente leitura)" : ""}
          </h2>
          <span
            className={`inline-flex rounded-badge px-2 py-0.5 text-xs font-medium ${
              status === "publicado"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {status === "publicado" ? "Publicado" : "Rascunho"}
          </span>
        </div>
        {updatedAt ? (
          <p className="mt-1 text-xs text-slate-400">Última atualização: {new Date(updatedAt).toLocaleString("pt-BR")}</p>
        ) : null}
      </div>

      <div className="space-y-3 p-4">
        <label htmlFor="outras-atividades" className="sr-only">
          Descreva outras atividades do período
        </label>
        <textarea
          id="outras-atividades"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          rows={8}
          readOnly={readOnly}
          placeholder={
            readOnly
              ? "Nenhuma atividade adicional registrada."
              : "Ex.: QA das issues 1241 e 1230, reteste da 1257, apoio em design..."
          }
          className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 ${
            readOnly ? "cursor-default bg-slate-50" : ""
          }`}
        />

        {readOnly ? null : (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => save("rascunho")}
              className="br-button secondary"
            >
              Salvar rascunho
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => save("publicado")}
              className="br-button primary"
            >
              Publicar
            </button>
          </div>
        )}

        {message ? (
          <SystemFeedback variant="success" mode="inline" message={message} />
        ) : null}
        {error ? <SystemFeedback variant="danger" mode="inline" message={error} /> : null}
      </div>
    </section>
  );
}
