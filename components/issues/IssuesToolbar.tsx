"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { FAIXAS_IDADE_ISSUES, TODOS } from "@/lib/dashboard/constants";
import { ensureFilterOption } from "@/lib/dashboard/filters";

import { IssuesColumnToggle } from "./IssuesColumnToggle";

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
  exportHref: string;
};

function LabeledSelect({
  label,
  name,
  value,
  options,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="font-medium text-slate-600">{label}</span>
      <select
        name={name}
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-[9rem] rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function IssuesToolbar({ autores, exportHref }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");

  const estadoValue = searchParams.get("estado") ?? TODOS;
  const faixaValue = searchParams.get("faixaIdade") ?? TODOS;

  const faixaOptions = ensureFilterOption(
    [...FAIXAS_IDADE_ISSUES],
    faixaValue === TODOS ? TODOS : faixaValue,
  ).map((value) => ({
    value,
    label: value === TODOS ? "Todas as faixas" : value,
  }));

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-700">Filtros da listagem</h3>
        <a
          href={exportHref}
          className="inline-flex items-center gap-2 rounded-button bg-govbr-blue px-4 py-2 text-sm font-medium text-white hover:bg-govbr-blue-dark"
        >
          Exportar Excel
        </a>
      </div>

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
          className="rounded-button bg-govbr-blue px-4 py-2 text-sm font-medium text-white hover:bg-govbr-blue-dark"
        >
          Buscar
        </button>
      </form>

      <div className="flex flex-wrap items-end gap-2">
        <LabeledSelect
          label="Estado"
          name="estado"
          value={estadoValue}
          options={ESTADOS}
          onChange={(value) => setParam("estado", value)}
        />

        <LabeledSelect
          label="Faixa de idade"
          name="faixaIdade"
          value={faixaValue}
          options={faixaOptions}
          onChange={(value) => setParam("faixaIdade", value)}
        />

        <LabeledSelect
          label="Autor(a)"
          name="autor"
          value={searchParams.get("autor") ?? TODOS}
          options={autores.map((autor) => ({
            value: autor,
            label: autor === TODOS ? "Todos os autores" : autor,
          }))}
          onChange={(value) => setParam("autor", value)}
        />

        <LabeledSelect
          label="SLA"
          name="sla"
          value={searchParams.get("sla") ?? TODOS}
          options={SLAS}
          onChange={(value) => setParam("sla", value)}
        />

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
            className="rounded-button border border-govbr-blue px-3 py-1.5 text-sm font-medium text-govbr-blue hover:bg-blue-50"
          >
            Aplicar período
          </button>
        </form>

        {(searchParams.get("criadoDe") || searchParams.get("criadoAte")) && (
          <button
            type="button"
            onClick={clearDateRange}
            className="rounded-button px-2 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            Limpar datas de criação
          </button>
        )}

        {(searchParams.get("fechadoDe") ||
          searchParams.get("fechadoAte") ||
          searchParams.get("mergeadoDe") ||
          searchParams.get("mergeadoAte")) && (
          <div className="flex w-full flex-wrap items-center gap-2 border-t border-slate-100 pt-2 text-xs text-slate-600">
            {searchParams.get("fechadoDe") || searchParams.get("fechadoAte") ? (
              <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-800">
                Fechamento: {searchParams.get("fechadoDe") ?? "…"} →{" "}
                {searchParams.get("fechadoAte") ?? "…"}
              </span>
            ) : null}
            {searchParams.get("mergeadoDe") || searchParams.get("mergeadoAte") ? (
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-800">
                Merge: {searchParams.get("mergeadoDe") ?? "…"} →{" "}
                {searchParams.get("mergeadoAte") ?? "…"}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() =>
                pushParams((params) => {
                  params.delete("fechadoDe");
                  params.delete("fechadoAte");
                  params.delete("mergeadoDe");
                  params.delete("mergeadoAte");
                })
              }
              className="rounded-button px-2 py-1 font-medium text-slate-500 hover:text-slate-700"
            >
              Limpar fechamento/merge
            </button>
          </div>
        )}

        {isPending ? <span className="self-center text-xs text-slate-400">Buscando…</span> : null}
      </div>

      <IssuesColumnToggle />

      <p className="text-xs text-slate-500">
        Clique nos cabeçalhos da tabela para ordenar por qualquer coluna.
      </p>
    </div>
  );
}
