import type { ReactNode } from "react";

import { IssueDrilldownLink } from "@/components/dashboard/IssueDrilldownLink";

type Props = {
  /** Contagem bruta; link só aparece quando > 0. */
  count: number;
  href: string | null | undefined;
  /** Rótulo para acessibilidade e title do link. */
  label: string;
  children: ReactNode;
};

/** Contagem de issues com drill-down para /issues (nova aba) quando count > 0. */
export function IssueCountLink({ count, href, label, children }: Props) {
  if (!href || count <= 0) {
    return <>{children}</>;
  }

  return (
    <IssueDrilldownLink href={href} title={`Ver issues — ${label}`}>
      {children}
    </IssueDrilldownLink>
  );
}
