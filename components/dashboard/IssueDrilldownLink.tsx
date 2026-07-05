import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  href: string;
  children: ReactNode;
  title?: string;
};

/** Link para /issues em nova aba (drill-down a partir de KPIs/alertas). */
export function IssueDrilldownLink({ href, children, title }: Props) {
  const linkTitle = title ?? "Ver issues filtradas (nova aba)";
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      prefetch={false}
      title={linkTitle}
      aria-label={linkTitle}
      className="font-medium text-govbr-blue hover:text-govbr-blue-dark hover:underline"
    >
      {children}
    </Link>
  );
}
