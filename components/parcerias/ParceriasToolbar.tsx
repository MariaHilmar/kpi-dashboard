"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { TODOS } from "@/lib/dashboard/constants";
import {
  buildParceriasSelectOptions,
  defaultPreviousMonthRange,
} from "@/lib/dashboard/parcerias-config";

type Props = {
  parcerias: string[];
  exportHref: string;
};

export function ParceriasToolbar({ parcerias, exportHref }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const options = buildParceriasSelectOptions(parcerias);
  const defaults = defaultPreviousMonthRange();
  const parceiro = searchParams.get("parceiro") ?? TODOS;
  const fechadoDe = searchParams.get("fechadoDe") ?? defaults.fechadoDe;
  const fechadoAte = searchParams.get("fechadoAte") ?? defaults.fechadoAte;
  const criadoDe = searchParams.get("criadoDe") ?? "";
  const criadoAte = searchParams.get("criadoAte") ?? "";

  function pushParams(params: URLSearchParams) {
    startTransition(() => {
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  }

  function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextParceiro = String(formData.get("parceiro") ?? TODOS);
    const nextFechadoDe = String(formData.get("fechadoDe") ?? "");
    const nextFechadoAte = String(formData.get("fechadoAte") ?? "");
    const nextCriadoDe = String(formData.get("criadoDe") ?? "");
    const nextCriadoAte = String(formData.get("criadoAte") ?? "");

    const params = new URLSearchParams(searchParams.toString());
    if (nextParceiro !== TODOS) params.set("parceiro", nextParceiro);
    else params.delete("parceiro");
    if (nextFechadoDe) params.set("fechadoDe", nextFechadoDe);
    else params.delete("fechadoDe");
    if (nextFechadoAte) params.set("fechadoAte", nextFechadoAte);
    else params.delete("fechadoAte");
    if (nextCriadoDe) params.set("criadoDe", nextCriadoDe);
    else params.delete("criadoDe");
    if (nextCriadoAte) params.set("criadoAte", nextCriadoAte);
    else params.delete("criadoAte");

    pushParams(params);
  }

  function applyPreviousMonth() {
    const range = defaultPreviousMonthRange();
    const params = new URLSearchParams(searchParams.toString());
    params.set("fechadoDe", range.fechadoDe);
    params.set("fechadoAte", range.fechadoAte);
    pushParams(params);
  }

  function clearCreationDates() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("criadoDe");
    params.delete("criadoAte");
    pushParams(params);
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-700">Recorte do relatório</h3>
        <a
          href={exportHref}
          className="inline-flex items-center gap-2 rounded-lg bg-govbr-blue px-4 py-2 text-sm font-medium text-white hover:bg-govbr-blue-dark"
        >
          Exportar Excel
        </a>
      </div>

      <form onSubmit={applyFilters} className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-slate-600">Parceria</span>
          <select
            name="parceiro"
            aria-label="Parceria"
            defaultValue={parceiro}
            key={`parceiro-${parceiro}`}
            className="min-w-[10rem] rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
          >
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-slate-600">Fechado de</span>
          <input
            type="date"
            name="fechadoDe"
            aria-label="Data inicial de fechamento"
            defaultValue={fechadoDe}
            key={`fechadoDe-${fechadoDe}`}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-slate-600">Fechado até</span>
          <input
            type="date"
            name="fechadoAte"
            aria-label="Data final de fechamento"
            defaultValue={fechadoAte}
            key={`fechadoAte-${fechadoAte}`}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-slate-600">Criado de</span>
          <input
            type="date"
            name="criadoDe"
            aria-label="Data inicial de criação"
            defaultValue={criadoDe}
            key={`criadoDe-${criadoDe}`}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-slate-600">Criado até</span>
          <input
            type="date"
            name="criadoAte"
            aria-label="Data final de criação"
            defaultValue={criadoAte}
            key={`criadoAte-${criadoAte}`}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
          />
        </label>

        <button
          type="submit"
          className="rounded-lg bg-govbr-blue px-4 py-1.5 text-sm font-medium text-white hover:bg-govbr-blue-dark"
        >
          Aplicar
        </button>

        <button
          type="button"
          onClick={applyPreviousMonth}
          className="rounded-lg border border-govbr-blue px-3 py-1.5 text-sm font-medium text-govbr-blue hover:bg-blue-50"
        >
          Mês Anterior
        </button>

        {(criadoDe || criadoAte) && (
          <button
            type="button"
            onClick={clearCreationDates}
            className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            Limpar datas de criação
          </button>
        )}

        {isPending ? <span className="self-center text-xs text-slate-400">Atualizando…</span> : null}
      </form>

      <p className="text-xs text-slate-500">
        Parcerias via label <code className="text-slate-600">Parceria::</code> no GitLab. Filtros de
        fechamento e criação são cumulativos quando ambos estão preenchidos.
      </p>
    </div>
  );
}
