import { redirect } from "next/navigation";

import { type DashboardPageProps } from "@/lib/dashboard/page";

/** Mantido por compatibilidade - redireciona para a impressão completa do Executivo. */
export default async function MergeadasImprimirRedirect({
  searchParams,
}: DashboardPageProps) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value) qs.set(key, value);
  }
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  redirect(`/executivo/imprimir${suffix}`);
}
