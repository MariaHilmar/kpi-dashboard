"use client";

import { useEffect, useRef, useState } from "react";

import { TODOS } from "@/lib/dashboard/constants";

type MultiSelectFieldProps = {
  label: string;
  name: string;
  value: string;
  options: string[];
  formatLabel?: (option: string) => string;
  onChange: (name: string, value: string) => void;
};

function selectedSummary(selected: string[], labelFor: (option: string) => string): string {
  if (selected.length === 0) return "Todos";
  if (selected.length === 1) return labelFor(selected[0]);
  return `${selected.length} selecionados`;
}

/**
 * Multi-selecao via dropdown de checkboxes.
 * Valor serializado como lista separada por virgula; vazio equivale a Todos.
 */
export function MultiSelectField({
  label,
  name,
  value,
  options,
  formatLabel,
  onChange,
}: Readonly<MultiSelectFieldProps>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const labelFor = formatLabel ?? ((option: string) => option);
  const optionsId = `${name}-options`;

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

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1 text-xs">
      <span className="font-medium text-slate-600">{label}</span>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={optionsId}
        aria-label={label}
        onClick={() => setOpen((current) => !current)}
        className="flex min-w-[9rem] items-center justify-between rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-left text-sm text-slate-900"
      >
        <span className="truncate">{selectedSummary(selected, labelFor)}</span>
        <span className="ml-1 text-slate-400">▾</span>
      </button>
      {open ? (
        <div
          id={optionsId}
          className="absolute top-full z-20 mt-1 max-h-64 w-full min-w-[12rem] overflow-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
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
            <span>Todos</span>
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
                <span className="truncate">{labelFor(option)}</span>
              </label>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
