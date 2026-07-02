const KPI_SKELETON_IDS = ["kpi-1", "kpi-2", "kpi-3", "kpi-4", "kpi-5", "kpi-6"] as const;

export function FluxoResumoSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {KPI_SKELETON_IDS.map((id) => (
          <div
            key={id}
            className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white"
          />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white" />
        <div className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white" />
        <div className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white" />
        <div className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white" />
      </div>
    </div>
  );
}

export function FluxoCfdSkeleton() {
  return (
    <div
      className="h-96 animate-pulse rounded-xl border border-slate-200 bg-white"
      aria-hidden
    />
  );
}
