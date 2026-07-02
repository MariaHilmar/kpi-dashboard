import Link from "next/link";

import type { KpiTrend } from "@/lib/dashboard/flow-charts";
import { formatDecimal } from "@/lib/format";

type KpiAccent = "default" | "success" | "warning" | "danger" | "info";

const ACCENTS: Record<KpiAccent, string> = {
  default: "bg-white border-slate-200",
  success: "bg-emerald-50 border-emerald-200",
  warning: "bg-amber-50 border-amber-200",
  danger: "bg-rose-50 border-rose-200",
  info: "bg-blue-50 border-blue-200",
};

const TREND_SENTIMENT_CLASS = {
  positive: "text-emerald-700",
  negative: "text-rose-700",
} as const;

function formatTrendPercent(percent: number): string {
  const rounded = Math.round(percent);
  if (rounded > 0) return `+${formatDecimal(rounded, 0)}%`;
  if (rounded < 0) return `−${formatDecimal(Math.abs(rounded), 0)}%`;
  return `${formatDecimal(0, 0)}%`;
}

function KpiTrendLine({ trend }: Readonly<{ trend: KpiTrend }>) {
  if (trend.kind === "empty") {
    return <p className="mt-1 text-xs text-slate-400">{trend.label}</p>;
  }

  const arrow = trend.direction === "up" ? "▲" : "▼";
  const colorClass = TREND_SENTIMENT_CLASS[trend.sentiment];

  return (
    <p className={`mt-1 text-xs font-medium ${colorClass}`}>
      {arrow} {formatTrendPercent(trend.percent)} vs período anterior
    </p>
  );
}

export type KpiCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  trend?: KpiTrend;
  accent?: KpiAccent;
  /** Link interno (ex.: lista de issues). */
  href?: string;
  /** Link externo (ex.: GitLab). Não combinar com href. */
  externalHref?: string;
};

export function KpiCard({
  label,
  value,
  hint,
  trend,
  accent = "default",
  href,
  externalHref,
}: Readonly<KpiCardProps>) {
  const baseClass = `rounded-xl border p-4 shadow-sm ${ACCENTS[accent]}`;
  const interactiveClass = `${baseClass} block transition hover:shadow-md hover:ring-2 hover:ring-blue-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`;

  const content = (
    <>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      {trend ? <KpiTrendLine trend={trend} /> : null}
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </>
  );

  if (externalHref) {
    return (
      <a
        href={externalHref}
        target="_blank"
        rel="noreferrer"
        aria-label={`Abrir no GitLab: ${label}`}
        className={interactiveClass}
      >
        {content}
      </a>
    );
  }

  if (href) {
    return (
      <Link href={href} aria-label={`Ver issues: ${label}`} className={interactiveClass}>
        {content}
      </Link>
    );
  }

  return <div className={baseClass}>{content}</div>;
}
