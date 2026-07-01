"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useTransition } from "react";

import { ensureFilterOption, sortFilterOptions } from "@/lib/dashboard/filters";
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
        aria-label={label}
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
  const selectedParceria = read("parceria");
  const selectedEpico = read("epico");
  const selectedSprint = read("sprint");
  const selectedEquipe = read("equipe");
  const selectedTipo = read("tipo");
  const selectedAno = read("ano");

  const moduloOptions = useMemo(() => {
    let list = options.modulos;
    if (selectedArea !== "Todos") {
      const relacionados = options.moduloAreaPairs
        .filter((p) => p.area === selectedArea)
        .map((p) => p.modulo);
      list = sortFilterOptions(Array.from(new Set(relacionados)));
    }
    return ensureFilterOption(list, selectedModulo);
  }, [options.modulos, options.moduloAreaPairs, selectedArea, selectedModulo]);

  const areaOptions = useMemo(() => {
    let list = options.areas;
    if (selectedModulo !== "Todos") {
      const relacionadas = options.moduloAreaPairs
        .filter((p) => p.modulo === selectedModulo)
        .map((p) => p.area);
      list = sortFilterOptions(Array.from(new Set(relacionadas)));
    }
    return ensureFilterOption(list, selectedArea);
  }, [options.areas, options.moduloAreaPairs, selectedModulo, selectedArea]);

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
      if (value === "Todos" || value === "") {
        if (name === "sprint") params.set("sprint", "Todos");
        else params.delete(name);
      } else params.set(name, value);

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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        <SelectField
          label="Módulo"
          name="modulo"
          value={selectedModulo}
          options={moduloOptions}
          onChange={updateFilter}
        />
        <SelectField
          label="Área funcional"
          name="area"
          value={selectedArea}
          options={areaOptions}
          onChange={updateFilter}
        />
        <SelectField
          label="Épico"
          name="epico"
          value={selectedEpico}
          options={ensureFilterOption(options.epicos, selectedEpico)}
          onChange={updateFilter}
        />
        <SelectField
          label="Parceria"
          name="parceria"
          value={selectedParceria}
          options={ensureFilterOption(options.parcerias, selectedParceria)}
          onChange={updateFilter}
        />
        <SelectField
          label="Sprint"
          name="sprint"
          value={selectedSprint}
          options={ensureFilterOption(options.sprints, selectedSprint)}
          onChange={updateFilter}
        />
        <SelectField
          label="Equipe"
          name="equipe"
          value={selectedEquipe}
          options={ensureFilterOption(options.equipes, selectedEquipe)}
          onChange={updateFilter}
        />
        <SelectField
          label="Tipo"
          name="tipo"
          value={selectedTipo}
          options={ensureFilterOption(options.tipos, selectedTipo)}
          onChange={updateFilter}
        />
        <SelectField
          label="Ano criação"
          name="ano"
          value={selectedAno}
          options={ensureFilterOption(anoOptions, selectedAno)}
          onChange={updateFilter}
        />
      </div>

      {isPending ? <p className="mt-2 text-xs text-slate-400">Atualizando…</p> : null}
    </section>
  );
}
