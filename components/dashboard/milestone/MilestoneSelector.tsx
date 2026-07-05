"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import type { MilestoneOption } from "@/lib/dashboard/milestone-options";

type MilestoneSelectorProps = {
  milestones: MilestoneOption[];
  selectedIid: number | null;
};

export function MilestoneSelector({ milestones, selectedIid }: Readonly<MilestoneSelectorProps>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function onChange(nextIid: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextIid) params.set("iid", nextIid);
    else params.delete("iid");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <label htmlFor="milestone-iid" className="mb-2 block text-sm font-medium text-slate-700">
        Sprint (milestone GitLab)
      </label>
      <select
        id="milestone-iid"
        value={selectedIid ?? ""}
        onChange={(event) => onChange(event.target.value)}
        disabled={isPending || milestones.length === 0}
        className="w-full max-w-md rounded-button border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 disabled:opacity-50"
      >
        {milestones.length === 0 ? (
          <option value="">Nenhuma milestone importada</option>
        ) : (
          milestones.map((milestone) => (
            <option key={milestone.id} value={milestone.gitlab_milestone_iid ?? ""}>
              {milestone.gitlab_milestone_iid != null
                ? `Sprint ${milestone.gitlab_milestone_iid} — ${milestone.titulo}`
                : milestone.titulo}
            </option>
          ))
        )}
      </select>
      {isPending ? <p className="mt-2 text-xs text-slate-400">Carregando…</p> : null}
    </section>
  );
}
