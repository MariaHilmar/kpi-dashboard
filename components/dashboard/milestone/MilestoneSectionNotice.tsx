import type { ReactNode } from "react";

type MilestoneSectionNoticeProps = {
  children: ReactNode;
};

/** Aviso inline em seções milestone (dados ausentes, pré-requisitos). */
export function MilestoneSectionNotice({ children }: Readonly<MilestoneSectionNoticeProps>) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      {children}
    </div>
  );
}
