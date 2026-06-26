"use client";

import type { ReactNode } from "react";

type Column<T> = {
  key: keyof T | string;
  header: string;
  align?: "left" | "right" | "center";
  className?: string;
  render?: (row: T) => ReactNode;
};

type TabelaCardProps<T> = {
  title: string;
  subtitle?: string;
  columns: Column<T>[];
  rows: T[];
  emptyMessage?: string;
};

export function TabelaCard<T>({
  title,
  subtitle,
  columns,
  rows,
  emptyMessage = "Sem registros.",
}: TabelaCardProps<T>) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
      </div>

      {rows.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500">
          {emptyMessage}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    className={`px-3 py-2 text-${col.align ?? "left"} font-semibold uppercase tracking-wide text-xs text-slate-500 ${col.className ?? ""}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  {columns.map((col) => {
                    const align = col.align ?? "left";
                    const value = col.render
                      ? col.render(row)
                      : ((row as Record<string, unknown>)[col.key as string] as ReactNode);
                    return (
                      <td
                        key={String(col.key)}
                        className={`px-3 py-2 text-${align} text-slate-700 ${col.className ?? ""}`}
                      >
                        {value as ReactNode}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
