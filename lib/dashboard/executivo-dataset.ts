import { TODOS, TOP_LIMIT } from "@/lib/dashboard/constants";
import {
  fetchAggregate,
  fetchKpis,
  fetchKpisPorTipo,
  fetchFluxoMensal,
  fetchLeadTimePorModulo,
  fetchMergeadasPivot,
  fetchMergeadasPorEpico,
  fetchMergeadasPorPeriodo,
} from "@/lib/dashboard/fetchers";
import { lastMonthsKeys } from "@/lib/dashboard/mergeadas-format";
import type {
  ChartPoint,
  DashboardFilters,
  DashboardKpisFull,
  FluxoMensal,
  KpiPorTipo,
  LeadTimePorModulo,
  MergeadaPivotRow,
  MergeadaPorEpico,
  MergeadaPorPeriodo,
} from "@/types/database";

export type ExecutivoDataset = {
  kpis: DashboardKpisFull | null;
  fluxoMensal: FluxoMensal[];
  distribuicao: {
    status: ChartPoint[];
    tipo: ChartPoint[];
    prioridade: ChartPoint[];
  };
  detalhamento: {
    parceria: ChartPoint[];
    modulos: ChartPoint[];
    areaFuncional: ChartPoint[];
    equipes: ChartPoint[];
    leadTimePorModulo: LeadTimePorModulo[];
    kpisPorTipo: KpiPorTipo[];
  };
  mergeadas: {
    porPeriodo: MergeadaPorPeriodo[];
    porEpico: MergeadaPorEpico[];
    pivot: MergeadaPivotRow[];
    periodos: string[];
    porModulo: boolean;
    totalMergeadas: number;
  };
};

/** Reúne TODOS os dados exibidos na página Executivo (para exports completos). */
export async function fetchExecutivoDataset(
  filters: DashboardFilters,
): Promise<ExecutivoDataset> {
  const [
    kpis,
    fluxoMensal,
    status,
    tipo,
    prioridade,
    parceria,
    modulos,
    areaFuncional,
    equipes,
    leadTimePorModulo,
    kpisPorTipo,
    porPeriodo,
    porEpico,
    pivot,
  ] = await Promise.all([
    fetchKpis(filters),
    fetchFluxoMensal(filters),
    fetchAggregate("status", filters),
    fetchAggregate("tipo", filters),
    fetchAggregate("prioridade", filters),
    fetchAggregate("parceria", filters),
    fetchAggregate("modulo", filters, { limit: TOP_LIMIT.modulo }),
    fetchAggregate("area_funcional", filters, { limit: TOP_LIMIT.area }),
    fetchAggregate("equipe", filters, { limit: TOP_LIMIT.equipe }),
    fetchLeadTimePorModulo(filters),
    fetchKpisPorTipo(filters),
    fetchMergeadasPorPeriodo(filters),
    fetchMergeadasPorEpico(filters),
    fetchMergeadasPivot(filters),
  ]);

  return {
    kpis,
    fluxoMensal,
    distribuicao: { status, tipo, prioridade },
    detalhamento: {
      parceria,
      modulos,
      areaFuncional,
      equipes,
      leadTimePorModulo,
      kpisPorTipo,
    },
    mergeadas: {
      porPeriodo,
      porEpico,
      pivot,
      periodos: lastMonthsKeys(6),
      porModulo: filters.modulo === TODOS,
      totalMergeadas: porPeriodo.reduce((acc, row) => acc + row.total, 0),
    },
  };
}
