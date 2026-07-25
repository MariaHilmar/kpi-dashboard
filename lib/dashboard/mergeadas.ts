import {
  fetchKpisPorTipo,
  fetchMergeadasPorEpico,
  fetchMergeadasPorPeriodo,
} from "@/lib/dashboard/fetchers";
import type {
  DashboardFilters,
  KpiPorTipo,
  MergeadaPorEpico,
  MergeadaPorPeriodo,
} from "@/types/database";

export type MergeadasDataset = {
  porPeriodo: MergeadaPorPeriodo[];
  porEpico: MergeadaPorEpico[];
  kpisPorTipo: KpiPorTipo[];
  totalMergeadas: number;
};

/**
 * Reúne os três recortes das novas visões do Executivo:
 * - Mergeadas por período (mês/ano de criação da issue)
 * - Mergeadas por épico
 * - KPI por tipo (todos os tipos, inclusive zero)
 *
 * Fonte única usada pela seção do dashboard e pelos exports (Excel/Word/PDF).
 */
export async function fetchMergeadasDataset(
  filters: DashboardFilters,
): Promise<MergeadasDataset> {
  const [porPeriodo, porEpico, kpisPorTipo] = await Promise.all([
    fetchMergeadasPorPeriodo(filters),
    fetchMergeadasPorEpico(filters),
    fetchKpisPorTipo(filters),
  ]);

  const totalMergeadas = porPeriodo.reduce((acc, row) => acc + row.total, 0);

  return { porPeriodo, porEpico, kpisPorTipo, totalMergeadas };
}

export { formatPeriodoLabel } from "@/lib/dashboard/mergeadas-format";
