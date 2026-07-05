"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

type Props = {
  page: number;
  pageSize: number;
  total: number;
};

export function IssuesPagination({ page, pageSize, total }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  function goTo(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) params.delete("page");
    else params.set("page", String(nextPage));
    startTransition(() => {
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
      <span>
        {from.toLocaleString("pt-BR")}–{to.toLocaleString("pt-BR")} de{" "}
        {total.toLocaleString("pt-BR")}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1 || isPending}
          onClick={() => goTo(page - 1)}
          className="rounded-button border border-slate-300 px-3 py-1.5 font-medium disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50"
        >
          Anterior
        </button>
        <span className="text-xs text-slate-500">
          Página {page} de {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages || isPending}
          onClick={() => goTo(page + 1)}
          className="rounded-button border border-slate-300 px-3 py-1.5 font-medium disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
