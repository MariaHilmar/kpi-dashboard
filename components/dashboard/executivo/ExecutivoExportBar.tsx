"use client";

import { useState } from "react";

import { filtersToSearchParams } from "@/lib/dashboard/filters";
import type { DashboardFilters } from "@/types/database";

type Props = {
  filters: DashboardFilters;
};

const BTN_CLASS =
  "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";

function Spinner() {
  return (
    <svg
      className="h-3.5 w-3.5 animate-spin text-slate-500"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

/** Exporta TODA a página Executivo (KPIs, evolução, distribuição, detalhamento e mergeadas). */
export function ExecutivoExportBar({ filters }: Props) {
  const qs = filtersToSearchParams(filters).toString();
  const suffix = qs ? `?${qs}` : "";
  const [loading, setLoading] = useState<"excel" | "word" | null>(null);

  async function download(kind: "excel" | "word", url: string, fallbackName: string) {
    if (loading) return;
    setLoading(kind);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="?([^";]+)"?/);
      const name = match ? decodeURIComponent(match[1]) : fallbackName;

      const objUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objUrl;
      anchor.download = name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objUrl);
    } catch {
      window.alert("Não foi possível gerar o arquivo. Tente novamente.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        className={BTN_CLASS}
        disabled={loading !== null}
        onClick={() => download("excel", `/api/executivo/export${suffix}`, "executivo.xlsx")}
      >
        {loading === "excel" ? <Spinner /> : null}
        {loading === "excel" ? "Gerando Excel…" : "Exportar Excel"}
      </button>
      <a
        className={BTN_CLASS}
        href={`/executivo/imprimir${suffix}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Imprimir PDF (A4)
      </a>
      <button
        type="button"
        className={BTN_CLASS}
        disabled={loading !== null}
        onClick={() => download("word", `/api/executivo/export/word${suffix}`, "executivo.docx")}
      >
        {loading === "word" ? <Spinner /> : null}
        {loading === "word" ? "Gerando Word…" : "Exportar Word (A4)"}
      </button>
    </div>
  );
}
