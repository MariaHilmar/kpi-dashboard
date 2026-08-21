"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { MultiSelectField } from "@/components/ui/MultiSelectField";
import { FAIXAS_IDADE_ISSUES, TODOS } from "@/lib/dashboard/constants";
import { ensureFilterOption } from "@/lib/dashboard/filters";
import { formatIssueStatusDisplayLabel } from "@/lib/dashboard/issue-status";

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
  statuses: string[];
  exportHref: string;
};

function LabeledSelect({
  label,
  name,
  value,
  options,
  onChange,
}: Readonly<{
  label: string;
  name: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}>) {
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

export function IssuesToolbar({ autores, statuses, exportHref }: Readonly<Props>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");

  const estadoValue = searchParams.get("estado") ?? TODOS;
  const faixaValue = searchParams.get("faixaIdade") ?? TODOS;
  const statusValue = searchParams.get("status") ?? TODOS;

  const faixaOptions = ensureFilterOption(
    [...FAIXAS_IDADE_ISSUES],
    faixaValue === TODOS ? TODOS : faixaValue,
  ).map((value) => ({
    value,
    label: value === TODOS ? "Todas as faixas" : value,
  }));

  const statusOptions = useMemo(() => {
    const selected = statusValue === TODOS ? [] : statusValue.split(",").map((item) => item.trim());
    let list = [...statuses];
    for (const item of selected) {
      list = ensureFilterOption(list, item);
    }
    return list;
  }, [statuses, statusValue]);

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

        <MultiSelectField
          label="Status"
          name="status"
          value={statusValue}
          options={statusOptions}
          formatLabel={formatIssueStatusDisplayLabel}
          onChange={setParam}
        />

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
