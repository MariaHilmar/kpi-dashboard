import { formatDateTime } from "@/lib/format";

type Props = {
  title: string;
  subtitle?: string;
  lastSync?: string | null;
};

export function PageHeader({ title, subtitle, lastSync }: Props) {
  return (
    <header className="space-y-1">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        {title}
      </h1>
      {subtitle ? <p className="max-w-3xl text-sm text-slate-600">{subtitle}</p> : null}
      {lastSync ? (
        <p className="text-xs text-slate-400">
          Última sincronização: {formatDateTime(lastSync)}
        </p>
      ) : null}
    </header>
  );
}
