import Link from "next/link";

type KpiAccent = "default" | "success" | "warning" | "danger" | "info";

const ACCENTS: Record<KpiAccent, string> = {
  default: "bg-white border-slate-200",
  success: "bg-emerald-50 border-emerald-200",
  warning: "bg-amber-50 border-amber-200",
  danger: "bg-rose-50 border-rose-200",
  info: "bg-blue-50 border-blue-200",
};

export type KpiCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  accent?: KpiAccent;
  /** Quando definido, o card vira um link de drill-down (ex.: lista de issues). */
  href?: string;
};

export function KpiCard({ label, value, hint, accent = "default", href }: KpiCardProps) {
  const baseClass = `rounded-xl border p-4 shadow-sm ${ACCENTS[accent]}`;

  const content = (
    <>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </>
  );

  if (!href) {
    return <div className={baseClass}>{content}</div>;
  }

  return (
    <Link
      href={href}
      aria-label={`Ver issues: ${label}`}
      className={`${baseClass} block transition hover:shadow-md hover:ring-2 hover:ring-blue-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
    >
      {content}
    </Link>
  );
}
