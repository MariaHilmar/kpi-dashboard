import { PageHeader } from "@/components/layout/PageHeader";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Parcerias" subtitle="Carregando relatório…" />
      <div className="h-28 animate-pulse rounded-xl bg-white" />
      <div className="h-64 animate-pulse rounded-xl bg-white" />
    </div>
  );
}
