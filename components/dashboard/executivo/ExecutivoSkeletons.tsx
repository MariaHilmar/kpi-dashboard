export function KpiGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-hidden>
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white"
        />
      ))}
    </div>
  );
}

export function ChartCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={`h-72 animate-pulse rounded-xl border border-slate-200 bg-white ${className ?? ""}`}
      aria-hidden
    />
  );
}

export function FluxoMensalSkeleton() {
  return <ChartCardSkeleton className="h-64" />;
}
