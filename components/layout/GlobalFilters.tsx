"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useTransition } from "react";

import { sortFilterOptions } from "@/lib/dashboard/filters";
import type { FilterOptions } from "@/types/database";

type Props = {
  options: FilterOptions;
};

function SelectField({
  label,
  name,
  value,
  options,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  options: string[];
  onChange: (name: string, value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="font-medium text-slate-600">{label}</span>
      <select
        name={name}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function GlobalFilters({ options }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const read = (key: string, fallback = "Todos") => searchParams.get(key) || fallback;

  const selectedModulo = read("modulo");
  const selectedArea = read("area");

  // Opções em cascata: módulo ↔ área funcional
  const moduloOptions = useMemo(() => {
    if (selectedArea === "Todos") return options.modulos;
    const relacionados = options.moduloAreaPairs
      .filter((p) => p.area === selectedArea)
      .map((p) => p.modulo);
    return sortFilterOptions(Array.from(new Set(relacionados)));
  }, [options.modulos, options.moduloAreaPairs, selectedArea]);

  const areaOptions = useMemo(() => {
    if (selectedModulo === "Todos") return options.areas;
    const relacionadas = options.moduloAreaPairs
      .filter((p) => p.modulo === selectedModulo)
      .map((p) => p.area);
    return sortFilterOptions(Array.from(new Set(relacionadas)));
  }, [options.areas, options.moduloAreaPairs, selectedModulo]);

  function pushParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    startTransition(() => {
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  }

  function updateFilter(name: string, value: string) {
    pushParams((params) => {
      if (value === "Todos" || value === "") params.delete(name);
      else params.set(name, value);

      // Mantém a coerência da relação módulo ↔ área
      if (name === "modulo") {
        const area = params.get("area");
        if (
          value !== "Todos" &&
          area &&
          !options.moduloAreaPairs.some((p) => p.modulo === value && p.area === area)
        ) {
          params.delete("area");
        }
      }
      if (name === "area") {
        const modulo = params.get("modulo");
        if (
          value !== "Todos" &&
          modulo &&
          !options.moduloAreaPairs.some((p) => p.area === value && p.modulo === modulo)
        ) {
          params.delete("modulo");
        }
      }
    });
  }

  function resetAll() {
    startTransition(() => {
      router.push(pathname);
    });
  }

  const anoOptions = ["Todos", ...options.anos.map(String)];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Filtros globais</h3>
        <button
          type="button"
          onClick={resetAll}
          className="text-xs font-medium text-govbr-blue hover:text-govbr-blue-dark"
        >
          Limpar filtros
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        <SelectField label="Módulo" name="modulo" value={selectedModulo} options={moduloOptions} onChange={updateFilter} />
        <SelectField label="Área funcional" name="area" value={selectedArea} options={areaOptions} onChange={updateFilter} />
        <SelectField label="Parceria" name="parceria" value={read("parceria")} options={options.parcerias} onChange={updateFilter} />
        <SelectField label="Sprint" name="sprint" value={read("sprint")} options={options.sprints} onChange={updateFilter} />
        <SelectField label="Equipe" name="equipe" value={read("equipe")} options={options.equipes} onChange={updateFilter} />
        <SelectField label="Tipo" name="tipo" value={read("tipo")} options={options.tipos} onChange={updateFilter} />
        <SelectField
          label="Ano criação"
          name="ano"
          value={read("ano")}
          options={anoOptions}
          onChange={updateFilter}
        />
      </div>

      {isPending ? <p className="mt-2 text-xs text-slate-400">Atualizando…</p> : null}
    </section>
  );
}
