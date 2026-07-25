"use client";

import { useEffect, useRef, useState } from "react";

import {
  PERIODO_TIPO_LABELS,
  PERIODO_TIPOS,
  type PeriodoTipo,
} from "@/lib/dashboard/constants";
import { formatPeriodSummary, formatPeriodSummaryShort, PERIODO_FILTER_TOOLTIP } from "@/lib/dashboard/period-filter";
import { InfoTooltip } from "@/components/ui/InfoTooltip";

type PeriodValue = {
  tipo: PeriodoTipo;
  de: string;
  ate: string;
};

type Props = {
  value: PeriodValue;
  yearPresets: number[];
  onChange: (next: PeriodValue | null) => void;
  className?: string;
};

export function PeriodFilterField({ value, yearPresets, onChange, className = "" }: Props) {
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

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const filterState = {
    periodoTipo: value.tipo,
    periodoDe: value.de || null,
    periodoAte: value.ate || null,
    ano: null,
  };

  const summaryFull = formatPeriodSummary(filterState, PERIODO_TIPO_LABELS);
  const summaryShort = formatPeriodSummaryShort(filterState, PERIODO_TIPO_LABELS);

  function applyYear(year: number) {
    onChange({
      tipo: "criacao",
      de: `${year}-01-01`,
      ate: `${year}-12-31`,
    });
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={`relative flex flex-col gap-1 text-xs ${className}`}>
      <div className="flex items-center gap-1">
        <span className="font-medium text-slate-600">Período</span>
        <InfoTooltip text={PERIODO_FILTER_TOOLTIP} />
      </div>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Período: ${summaryFull}`}
        title={summaryFull}
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-[34px] items-center justify-between rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-left text-sm text-slate-900"
      >
        <span className="truncate">
          <span className="sm:hidden">{summaryShort}</span>
          <span className="hidden sm:inline">{summaryFull}</span>
        </span>
        <span className="ml-1 shrink-0 text-slate-400">▾</span>
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Fechar filtro de período"
            className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-label="Filtro de período"
            className="fixed inset-x-4 bottom-4 z-50 max-h-[min(85vh,28rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-xl sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-full sm:mt-1 sm:w-80 sm:rounded-lg sm:p-3"
          >
            <p className="mb-3 text-sm font-semibold text-slate-800 sm:hidden">Período</p>

            <fieldset className="mb-3">
              <legend className="mb-2 text-xs font-medium text-slate-600">Tipo de data</legend>
              <div className="flex flex-wrap gap-1.5">
                {PERIODO_TIPOS.map((tipo) => {
                  const selected = value.tipo === tipo;
                  return (
                    <label
                      key={tipo}
                      className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition ${
                        selected
                          ? "border-govbr-blue bg-govbr-blue text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="periodoTipo"
                        checked={selected}
                        onChange={() => onChange({ ...value, tipo })}
                        className="sr-only"
                      />
                      {PERIODO_TIPO_LABELS[tipo]}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs text-slate-600">
                De
                <input
                  type="date"
                  value={value.de}
                  onChange={(event) => onChange({ ...value, de: event.target.value })}
                  className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-600">
                Até
                <input
                  type="date"
                  value={value.ate}
                  onChange={(event) => onChange({ ...value, ate: event.target.value })}
                  className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
                />
              </label>
            </div>

            {yearPresets.length > 0 ? (
              <div className="mb-3">
                <p className="mb-1.5 text-xs font-medium text-slate-600">Atalhos (criação)</p>
                <div className="flex flex-wrap gap-1.5">
                  {yearPresets.map((year) => (
                    <button
                      key={year}
                      type="button"
                      onClick={() => applyYear(year)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium hover:bg-slate-50"
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3 sm:border-0 sm:pt-0">
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                }}
                className="text-xs font-medium text-govbr-blue hover:text-govbr-blue-dark"
              >
                Limpar período
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg bg-govbr-blue px-3 py-1.5 text-xs font-medium text-white sm:hidden"
              >
                Aplicar
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
