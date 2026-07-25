"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { PeriodFilterField } from "@/components/layout/PeriodFilterField";
import { DEFAULT_PERIODO_TIPO, PERIODO_TIPOS, TODOS, type PeriodoTipo } from "@/lib/dashboard/constants";
import { ensureFilterOption, parseFilters, sortFilterOptions } from "@/lib/dashboard/filters";
import { formatPeriodContextLabel } from "@/lib/dashboard/period-filter";
import type { FilterOptions } from "@/types/database";

type Props = {
  options: FilterOptions;
};

/**
 * Extrai o módulo dono de um épico a partir do prefixo `[Módulo]` no título.
 * Ex.: "[Gestão Contratual] Evolução…" -> "Gestão Contratual".
 * Retorna null quando o épico não tem prefixo reconhecível.
 */
function epicoModulo(epico: string): string | null {
  const match = /^\s*\[([^\]]+)\]/.exec(epico);
  return match ? match[1].trim() : null;
}

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

/**
 * Multi-seleção via dropdown de checkboxes. O valor é serializado como lista
 * separada por vírgula (ex.: "Bug,Melhoria"); vazio => "Todos".
 */
function MultiSelectField({
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
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const selected =
    value && value !== TODOS
      ? value.split(",").map((item) => item.trim()).filter(Boolean)
      : [];
  const selectable = options.filter((option) => option !== TODOS);

  function toggle(option: string) {
    const set = new Set(selected);
    if (set.has(option)) set.delete(option);
    else set.add(option);
    const next = Array.from(set);
    onChange(name, next.length ? next.join(",") : TODOS);
  }

  const summary =
    selected.length === 0
      ? "Todos"
      : selected.length === 1
        ? selected[0]
        : `${selected.length} selecionados`;

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1 text-xs">
      <span className="font-medium text-slate-600">{label}</span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((current) => !current)}
        className="flex items-center justify-between rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-left text-sm text-slate-900"
      >
        <span className="truncate">{summary}</span>
        <span className="ml-1 text-slate-400">▾</span>
      </button>
      {open ? (
        <div
          role="listbox"
          className="absolute top-full z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
        >
          <button
            type="button"
            onClick={() => {
              onChange(name, TODOS);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-slate-50"
          >
            <span
              className={`inline-block h-3 w-3 rounded-sm border ${
                selected.length === 0 ? "border-govbr-blue bg-govbr-blue" : "border-slate-300"
              }`}
            />
            Todos
          </button>
          {selectable.map((option) => {
            const checked = selected.includes(option);
            return (
              <label
                key={option}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(option)}
                  className="h-3 w-3 accent-govbr-blue"
                />
                <span className="truncate">{option}</span>
              </label>
            );
          })}
        </div>
      ) : null}
    </div>
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
  const periodoTipo = ((): PeriodoTipo => {
    const raw = searchParams.get("periodoTipo");
    return raw && (PERIODO_TIPOS as readonly string[]).includes(raw)
      ? (raw as PeriodoTipo)
      : DEFAULT_PERIODO_TIPO;
  })();
  const periodoDe = searchParams.get("periodoDe") ?? "";
  const periodoAte = searchParams.get("periodoAte") ?? "";

  const periodContextLabel = useMemo(() => {
    const raw = Object.fromEntries(searchParams.entries());
    return formatPeriodContextLabel(parseFilters(raw));
  }, [searchParams]);

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

  const epicoOptions = useMemo(() => {
    if (selectedModulo === TODOS) {
      return ensureFilterOption(options.epicos, selectedEpico);
    }
    const filtered = options.epicos.filter((e) => epicoModulo(e) === selectedModulo);
    return ensureFilterOption(sortFilterOptions(filtered), selectedEpico);
  }, [options.epicos, selectedModulo, selectedEpico]);

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
        const epico = params.get("epico");
        if (value !== "Todos" && epico && epicoModulo(epico) !== value) {
          params.delete("epico");
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

  function updatePeriod(next: { tipo: PeriodoTipo; de: string; ate: string } | null) {
    pushParams((params) => {
      params.delete("ano");
      params.delete("periodoTipo");
      params.delete("periodoDe");
      params.delete("periodoAte");
      if (!next || (!next.de && !next.ate)) return;
      params.set("periodoTipo", next.tipo);
      if (next.de) params.set("periodoDe", next.de);
      if (next.ate) params.set("periodoAte", next.ate);
    });
  }

  function resetAll() {
    startTransition(() => {
      router.push(pathname);
    });
  }

  const yearPresets = options.anos.slice(0, 4);

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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
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
          options={epicoOptions}
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
        <MultiSelectField
          label="Tipo"
          name="tipo"
          value={selectedTipo}
          options={options.tipos}
          onChange={updateFilter}
        />
        <div className="col-span-2 border-t border-slate-100 pt-3 sm:col-span-3 lg:col-span-4 xl:col-span-1 xl:border-t-0 xl:pt-0">
          <div className="rounded-lg border border-govbr-blue/30 bg-blue-50 p-2">
            <PeriodFilterField
              value={{ tipo: periodoTipo, de: periodoDe, ate: periodoAte }}
              yearPresets={yearPresets}
              onChange={updatePeriod}
            />
          </div>
        </div>
      </div>

      {periodContextLabel ? (
        <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-600" role="status">
          {periodContextLabel}
        </p>
      ) : null}

      {isPending ? <p className="mt-2 text-xs text-slate-400">Atualizando…</p> : null}
    </section>
  );
}
