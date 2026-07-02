import { TODOS } from "@/lib/dashboard/constants";
import { searchAllIssues } from "@/lib/dashboard/issues";
import type { IssueRow } from "@/lib/dashboard/issues";
import {
  buildParceriasFilters,
  parceriasExigeParceria,
  type ParceriasSearchParams,
} from "@/lib/dashboard/parcerias-config";

export async function fetchParceriasIssues(
  params: ParceriasSearchParams,
): Promise<{ rows: IssueRow[]; total: number }> {
  const filters = buildParceriasFilters(params);

  return searchAllIssues(filters, {
    search: "",
    estado: TODOS,
    sla: TODOS,
    faixaIdade: null,
    autor: TODOS,
    criadoDe: params.criadoDe,
    criadoAte: params.criadoAte,
    fechadoDe: params.fechadoDe,
    fechadoAte: params.fechadoAte,
    exigeParceria: parceriasExigeParceria(params),
    order: params.order,
  });
}
