"use client";

import type { ReactNode } from "react";

import { CardSectionHeader } from "@/components/dashboard/CardSectionHeader";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
type Column<T> = {
  key: keyof T | string;
  header: string;
  align?: "left" | "right" | "center";
  className?: string;
  render?: (row: T) => ReactNode;
  /** Tooltip informativo exibido ao lado do rótulo do cabeçalho. */
  headerTooltip?: string;
};

type TabelaCardProps<T> = {
  title: string;
  subtitle?: string;
  titleTooltip?: string;
  columns: Column<T>[];
  rows: T[];
  emptyMessage?: string;
  rowClassName?: (row: T) => string | undefined;
  /** Limita a altura do corpo da tabela e habilita rolagem vertical (ex.: "max-h-80"). */
  bodyMaxHeight?: string;
};

export function TabelaCard<T>({
  title,
  subtitle,
  titleTooltip,
  columns,
  rows,
  emptyMessage = "Sem registros.",
  rowClassName,
  bodyMaxHeight,
}: TabelaCardProps<T>) {
  const isScrollable = Boolean(bodyMaxHeight);
  return (
    <section className="overflow-visible rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <CardSectionHeader title={title} subtitle={subtitle} tooltip={titleTooltip} />

      {rows.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500">
          {emptyMessage}
        </div>
      ) : (
        <div
          className={`overflow-x-auto ${isScrollable ? `${bodyMaxHeight} overflow-y-auto` : ""}`}
        >
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className={`bg-slate-50 ${isScrollable ? "sticky top-0 z-10" : ""}`}>
              <tr>
                {columns.map((col) => {
                  const align = col.align ?? "left";
                  const justify =
                    align === "right"
                      ? "justify-end"
                      : align === "center"
                        ? "justify-center"
                        : "justify-start";
                  return (
                    <th
                      key={String(col.key)}
                      className={`px-3 py-2 text-${align} font-semibold uppercase tracking-wide text-xs text-slate-500 ${col.className ?? ""}`}
                    >
                      {col.headerTooltip ? (
                        <span className={`inline-flex items-center gap-1 ${justify}`}>
                          {col.header}
                          <InfoTooltip text={col.headerTooltip} />
                        </span>
                      ) : (
                        col.header
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {rows.map((row, idx) => (
                <tr key={idx} className={rowClassName?.(row) ?? "hover:bg-slate-50"}>
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
