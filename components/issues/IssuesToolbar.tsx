"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

const ESTADOS = [
  { value: "Todos", label: "Todos os estados" },
  { value: "open", label: "Abertas" },
  { value: "closed", label: "Fechadas" },
];

const SLAS = [
  { value: "Todos", label: "Qualquer SLA" },
  { value: "acima_90", label: "SLA > 90 dias" },
];

const ORDERS = [
  { value: "criado_em_desc", label: "Mais recentes" },
  { value: "criado_em_asc", label: "Mais antigas" },
  { value: "lead_time_desc", label: "Maior lead time" },
  { value: "idade_desc", label: "Maior idade" },
  { value: "id_desc", label: "ID (desc)" },
];

export function IssuesToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    setSearch(searchParams.get("q") ?? "");
  }, [searchParams]);

  function pushParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    params.delete("page");
    startTransition(() => {
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  }

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    pushParams((params) => {
      if (search.trim()) params.set("q", search.trim());
      else params.delete("q");
    });
  }

  function setParam(key: string, value: string) {
    pushParams((params) => {
      if (value === "Todos" || value === "") params.delete(key);
      else params.set(key, value);
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <form onSubmit={submitSearch} className="flex gap-2" role="search">
        <label htmlFor="issues-search" className="sr-only">
          Buscar issues por título, autor, responsável ou ID
        </label>
        <input
          id="issues-search"
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por título, autor, responsável ou ID…"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
        />
        <button
          type="submit"
          className="rounded-lg bg-govbr-blue px-4 py-2 text-sm font-medium text-white hover:bg-govbr-blue-dark"
        >
          Buscar
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        <select
          aria-label="Filtrar por estado da issue"
          value={searchParams.get("estado") ?? "Todos"}
          onChange={(event) => setParam("estado", event.target.value)}
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
        >
          {ESTADOS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <select
          aria-label="Filtrar por SLA"
          value={searchParams.get("sla") ?? "Todos"}
          onChange={(event) => setParam("sla", event.target.value)}
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
        >
          {SLAS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <select
          aria-label="Ordenar resultados"
          value={searchParams.get("order") ?? "criado_em_desc"}
          onChange={(event) => setParam("order", event.target.value)}
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
        >
          {ORDERS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {isPending ? <span className="self-center text-xs text-slate-400">Buscando…</span> : null}
      </div>
    </div>
  );
}
