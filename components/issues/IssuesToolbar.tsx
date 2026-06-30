"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { TODOS } from "@/lib/dashboard/constants";

const ESTADOS = [
  { value: "Todos", label: "Todos os estados" },
  { value: "open", label: "Abertas" },
  { value: "closed", label: "Fechadas" },
];

const SLAS = [
  { value: "Todos", label: "Qualquer SLA" },
  { value: "acima_90", label: "SLA > 90 dias" },
];

type Props = {
  autores: string[];
};

export function IssuesToolbar({ autores }: Props) {
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
      if (value === TODOS || value === "") params.delete(key);
      else params.set(key, value);
    });
  }

  function applyDateRange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const de = String(formData.get("criadoDe") ?? "");
    const ate = String(formData.get("criadoAte") ?? "");

    pushParams((params) => {
      if (de) params.set("criadoDe", de);
      else params.delete("criadoDe");
      if (ate) params.set("criadoAte", ate);
      else params.delete("criadoAte");
    });
  }

  function clearDateRange() {
    pushParams((params) => {
      params.delete("criadoDe");
      params.delete("criadoAte");
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

      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-slate-600">Autor(a)</span>
          <select
            aria-label="Filtrar por autor da issue"
            value={searchParams.get("autor") ?? TODOS}
            onChange={(event) => setParam("autor", event.target.value)}
            className="min-w-[10rem] rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
          >
            {autores.map((autor) => (
              <option key={autor} value={autor}>
                {autor === TODOS ? "Todos os autores" : autor}
              </option>
            ))}
          </select>
        </label>

        <select
          aria-label="Filtrar por estado da issue"
          value={searchParams.get("estado") ?? TODOS}
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
          value={searchParams.get("sla") ?? TODOS}
          onChange={(event) => setParam("sla", event.target.value)}
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
        >
          {SLAS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <form onSubmit={applyDateRange} className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium text-slate-600">Criado de</span>
            <input
              type="date"
              name="criadoDe"
              aria-label="Data inicial de criação"
              defaultValue={searchParams.get("criadoDe") ?? ""}
              key={`criadoDe-${searchParams.get("criadoDe") ?? ""}`}
              className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium text-slate-600">Criado até</span>
            <input
              type="date"
              name="criadoAte"
              aria-label="Data final de criação"
              defaultValue={searchParams.get("criadoAte") ?? ""}
              key={`criadoAte-${searchParams.get("criadoAte") ?? ""}`}
              className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
            />
          </label>

          <button
            type="submit"
            className="rounded-lg border border-govbr-blue px-3 py-1.5 text-sm font-medium text-govbr-blue hover:bg-blue-50"
          >
            Aplicar período
          </button>
        </form>

        {(searchParams.get("criadoDe") || searchParams.get("criadoAte")) && (
          <button
            type="button"
            onClick={clearDateRange}
            className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            Limpar datas
          </button>
        )}

        {isPending ? <span className="self-center text-xs text-slate-400">Buscando…</span> : null}
      </div>

      <p className="text-xs text-slate-500">
        Clique nos cabeçalhos da tabela para ordenar por qualquer coluna.
      </p>
    </div>
  );
}
