"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import { PeriodFilterField } from "@/components/layout/PeriodFilterField";
import { MultiSelectField } from "@/components/ui/MultiSelectField";
import { DEFAULT_PERIODO_TIPO, PERIODO_TIPOS, TODOS, type PeriodoTipo } from "@/lib/dashboard/constants";
import {
  ensureFilterOption,
  parseFilters,
  resolveAreasForModulo,
  resolveModulosForArea,
  sortFilterOptions,
} from "@/lib/dashboard/filters";
import {
  defaultPeriodRange,
  formatPeriodContextLabelParts,
  OPEN_PERIOD_FILTER_EVENT,
  PERIODO_TODOS,
} from "@/lib/dashboard/period-filter";
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
}: Readonly<{
  label: string;
  name: string;
  value: string;
  options: string[];
  onChange: (name: string, value: string) => void;
}>) {
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

export function GlobalFilters({ options }: Readonly<Props>) {
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
  // "Todos" explícito (?periodo=todos) desliga o default; sem período/ano na URL exibe o default.
  const periodoTodos = searchParams.get("periodo") === PERIODO_TODOS;
  const hasExplicitPeriodo =
    searchParams.has("periodoDe") || searchParams.has("periodoAte") || searchParams.has("ano");
  const showDefaultPeriodo = !periodoTodos && !hasExplicitPeriodo;
  const periodoDefault = showDefaultPeriodo ? defaultPeriodRange() : null;

  const periodoTipo = ((): PeriodoTipo => {
    const raw = searchParams.get("periodoTipo");
    if (raw && (PERIODO_TIPOS as readonly string[]).includes(raw)) {
      return raw as PeriodoTipo;
    }
    return periodoDefault ? "fechamento" : DEFAULT_PERIODO_TIPO;
  })();
  const periodoDe = searchParams.get("periodoDe") ?? periodoDefault?.de ?? "";
  const periodoAte = searchParams.get("periodoAte") ?? periodoDefault?.ate ?? "";

  const periodContextParts = useMemo(() => {
    const raw = Object.fromEntries(searchParams.entries());
    return formatPeriodContextLabelParts(parseFilters(raw));
  }, [searchParams]);

  const [periodOpen, setPeriodOpen] = useState(false);

  useEffect(() => {
    function onOpenPeriodFilter() {
      setPeriodOpen(true);
      const el = document.getElementById("filtro-periodo-global");
      if (el && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
    window.addEventListener(OPEN_PERIOD_FILTER_EVENT, onOpenPeriodFilter);
    return () => window.removeEventListener(OPEN_PERIOD_FILTER_EVENT, onOpenPeriodFilter);
  }, []);

  const moduloOptions = useMemo(() => {
    let list = options.modulos;
    if (selectedArea !== TODOS) {
      list = sortFilterOptions(
        resolveModulosForArea(options.areasPorModulo, options.moduloAreaPairs, selectedArea),
      );
    }
    return ensureFilterOption(list, selectedModulo);
  }, [options.modulos, options.areasPorModulo, options.moduloAreaPairs, selectedArea, selectedModulo]);

  const epicoOptions = useMemo(() => {
    if (selectedModulo === TODOS) {
      return ensureFilterOption(options.epicos, selectedEpico);
    }
    const filtered = options.epicos.filter((e) => epicoModulo(e) === selectedModulo);
    return ensureFilterOption(sortFilterOptions(filtered), selectedEpico);
  }, [options.epicos, selectedModulo, selectedEpico]);

  const areaOptions = useMemo(() => {
    let list = options.areas;
    if (selectedModulo !== TODOS) {
      list = sortFilterOptions(
        resolveAreasForModulo(options.areasPorModulo, options.moduloAreaPairs, selectedModulo),
      );
    }
    return ensureFilterOption(list, selectedArea);
  }, [options.areas, options.areasPorModulo, options.moduloAreaPairs, selectedModulo, selectedArea]);

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
          value !== TODOS &&
          area &&
          !resolveAreasForModulo(options.areasPorModulo, options.moduloAreaPairs, value).includes(
            area,
          )
        ) {
          params.delete("area");
        }
        const epico = params.get("epico");
        if (value !== TODOS && epico && epicoModulo(epico) !== value) {
          params.delete("epico");
        }
      }
      if (name === "area") {
        const modulo = params.get("modulo");
        if (
          value !== TODOS &&
          modulo &&
          !resolveModulosForArea(
            options.areasPorModulo,
            options.moduloAreaPairs,
            value,
          ).includes(modulo)
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
      params.delete("periodo");
      if (!next || (!next.de && !next.ate)) {
        // "Limpar período": marca explicitamente Todos para não reaplicar o default de 6 meses.
        params.set("periodo", PERIODO_TODOS);
        return;
      }
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
          <div
            id="filtro-periodo-global"
            className="rounded-lg border border-govbr-blue/30 bg-blue-50 p-2"
          >
            <PeriodFilterField
              value={{ tipo: periodoTipo, de: periodoDe, ate: periodoAte }}
              yearPresets={yearPresets}
              onChange={updatePeriod}
              open={periodOpen}
              onOpenChange={setPeriodOpen}
            />
          </div>
        </div>
      </div>

      {periodContextParts ? (
        <p
          className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-sm text-slate-600"
          role="status"
        >
          <span>
            {periodContextParts.lead}
            <strong className="font-semibold text-slate-800">{periodContextParts.strong}</strong>
          </span>
          <button
            type="button"
            onClick={() => setPeriodOpen(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Alterar data
          </button>
        </p>
      ) : null}

      {isPending ? <p className="mt-2 text-xs text-slate-400">Atualizando…</p> : null}
    </section>
  );
}
