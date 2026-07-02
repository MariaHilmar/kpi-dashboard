import { FluxoCfdSkeleton, FluxoResumoSkeleton } from "@/components/dashboard/fluxo/FluxoSkeletons";

export default function FluxoLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-16 animate-pulse rounded-xl border border-slate-200 bg-white" aria-hidden />
      <FluxoResumoSkeleton />
      <FluxoCfdSkeleton />
    </div>
  );
}
