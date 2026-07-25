import type { PeriodoTipo } from "@/lib/dashboard/constants";

export type ChartPoint = {
  label: string;
  quantidade: number;
};

export type DashboardKpisFull = {
  total: number;
  abertas: number;
  fechadas: number;
  taxa_fechamento: number;
  lead_time_medio: number | null;
  bugs_abertos: number;
  melhorias_abertas: number;
  sem_tipo: number;
  pct_bugs_backlog: number;
  taxa_fech_bug: number;
  sla_acima_90: number;
};

export type FluxoMensal = {
  mes: string;
  criados: number;
  fechados: number;
  backlog_liquido: number;
  mergeadas: number;
};

export type LeadTimePorModulo = {
  modulo: string;
  itens: number;
  lead_medio: number | null;
  lead_mediano: number | null;
};

export type KpiPorTipo = {
  tipo: string;
  total: number;
  abertas: number;
  fechadas: number;
  taxa_fechamento: number;
  lead_medio: number | null;
  lead_mediano: number | null;
};

export type MergeadaPorPeriodo = {
  periodo: string;
  ano: number | null;
  mes: number | null;
  total: number;
};

export type MergeadaPorEpico = {
  epico: string;
  total: number;
};

/** Linha longa do pivô de mergeadas (linha = módulo ou épico, por período). */
export type MergeadaPivotRow = {
  linha: string;
  periodo: string;
  total: number;
};

export type TopLeadTime = {
  id: number | null;
  titulo: string | null;
  modulo: string | null;
  area: string | null;
  estado: string | null;
  status: string | null;
  prioridade: string | null;
  equipe: string | null;
  criado_em: string | null;
  fechado_em: string | null;
  lead_time: number | null;
};

export type AlertaResumo = {
  abertas: number;
  sem_epico: number;
  sem_parceria: number;
};

export type AlertaPorModulo = {
  modulo: string;
  qtde: number;
  percentual: number;
};

export type FaixaIdade = {
  faixa: string;
  qtde: number;
  percentual: number;
};

export type DashboardFilters = {
  modulo: string;
  area: string;
  tipo: string;
  prioridade: string;
  equipe: string;
  status: string;
  parceria: string;
  sprint: string;
  epico: string;
  repositorio: string;
  situacao: string;
  /** @deprecated URLs legadas (?ano=); derivado em periodoDe/periodoAte. */
  ano: number | null;
  periodoTipo: PeriodoTipo;
  periodoDe: string | null;
  periodoAte: string | null;
  criadoDe: string | null;
  criadoAte: string | null;
  fechadoDe: string | null;
  fechadoAte: string | null;
  mergeadoDe: string | null;
  mergeadoAte: string | null;
};

export type ModuloAreaPair = {
  modulo: string;
  area: string;
};

export type FilterOptions = {
  modulos: string[];
  areas: string[];
  tipos: string[];
  prioridades: string[];
  equipes: string[];
  statuses: string[];
  parcerias: string[];
  sprints: string[];
  epicos: string[];
  repositorios: string[];
  autores: string[];
  anos: number[];
  moduloAreaPairs: ModuloAreaPair[];
};

export type DashboardData = {
  configured: boolean;
  filters: DashboardFilters;
  filterOptions: FilterOptions;
  kpis: DashboardKpisFull | null;
  charts: {
    parceria: ChartPoint[];
    repositorio: ChartPoint[];
    areaFuncional: ChartPoint[];
    desenvolvedor: ChartPoint[];
    devMergeado: ChartPoint[];
    qualidade: ChartPoint[];
    releases: ChartPoint[];
    categoria: ChartPoint[];
    status: ChartPoint[];
    tipo: ChartPoint[];
    modulos: ChartPoint[];
    equipes: ChartPoint[];
    prioridades: ChartPoint[];
    backlogAcumulado: FluxoMensal[];
    fluxoMensal: FluxoMensal[];
    leadTimePorModulo: LeadTimePorModulo[];
  };
  tabelas: {
    kpisPorTipo: KpiPorTipo[];
    topLeadTimes: TopLeadTime[];
    semEpicoPorModulo: AlertaPorModulo[];
    semParceriaPorModulo: AlertaPorModulo[];
    faixaIdade: FaixaIdade[];
  };
  alertas: AlertaResumo | null;
  lastSync: string | null;
  error?: string;
};
