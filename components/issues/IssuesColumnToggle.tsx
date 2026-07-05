"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import {
  ISSUES_OPTIONAL_COLUMNS,
  parseIssuesTableColumns,
  serializeIssuesTableColumns,
  type IssuesOptionalColumnKey,
} from "@/lib/dashboard/issues-table-columns";

export function IssuesColumnToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const visible = new Set(parseIssuesTableColumns(searchParams.get("cols")));

  function toggleColumn(key: IssuesOptionalColumnKey, checked: boolean) {
    const next = new Set(visible);
    if (checked) next.add(key);
    else next.delete(key);

    const params = new URLSearchParams(searchParams.toString());
    const serialized = serializeIssuesTableColumns([...next]);
    if (serialized) params.set("cols", serialized);
    else params.delete("cols");
    params.delete("page");

    startTransition(() => {
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  }

  return (
    <fieldset className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
      <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
        Colunas Planning Poker
      </legend>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-2">
        {ISSUES_OPTIONAL_COLUMNS.map((column) => (
          <label key={column.key} className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={visible.has(column.key)}
              onChange={(event) => toggleColumn(column.key, event.target.checked)}
              className="rounded border-slate-300 text-govbr-blue focus:ring-govbr-blue"
            />
            {column.label}
          </label>
        ))}
      </div>
      {isPending ? <p className="mt-2 text-xs text-slate-400">Atualizando colunas…</p> : null}
    </fieldset>
  );
}
