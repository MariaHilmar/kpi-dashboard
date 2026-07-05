import type { AggregateDimension } from "@/lib/dashboard/constants";
import { NAO_INFORMADO } from "@/lib/dashboard/constants";
import type { SortColumn } from "@/lib/dashboard/table-sort";
import type { MilestoneDetail } from "@/lib/dashboard/milestone-report";

/** Dimensões aceitas por report_milestone_delivery_by_dimension. */
export const MILESTONE_DELIVERY_DIMENSIONS = [
  "equipe",
  "assignee",
  "modulo",
  "parceria",
] as const;

export type MilestoneDeliveryDimension = (typeof MILESTONE_DELIVERY_DIMENSIONS)[number];

export type MilestoneDeliveryRow = {
  label: string;
  entregues: number;
  pontos_entregues: number;
  wip_restante: number;
  wip_pontos: number;
};

export type MilestoneDeliveryMetric = "entregues" | "wip";

export const MILESTONE_DELIVERY_DIMENSION_LABELS: Record<MilestoneDeliveryDimension, string> = {
  equipe: "Equipe",
  assignee: "Responsável",
  modulo: "Módulo",
  parceria: "Parceria",
};

export const DEFAULT_MILESTONE_DELIVERY_LIMIT = 10;

export const MILESTONE_DELIVERY_LIMIT_OPTIONS = [5, 10, 14, 20] as const;

export const MILESTONE_DELIVERY_SORT_COLUMNS: SortColumn[] = [
  { key: "label", asc: "label_asc", desc: "label_desc" },
  { key: "entregues", asc: "entregues_asc", desc: "entregues_desc" },
  { key: "pontos_entregues", asc: "pontos_asc", desc: "pontos_desc" },
  { key: "wip_restante", asc: "wip_asc", desc: "wip_desc" },
];

export const DEFAULT_MILESTONE_DELIVERY_ORDER = "entregues_desc";

/** Nota anti-punitiva exigida nos critérios de aceite. */
export const MILESTONE_DELIVERY_ANTI_PUNITIVE_NOTE =
  "Estes números servem para visibilidade de carga e mix da sprint — não para ranking individual ou avaliação de desempenho. Considere tipo, módulo e dependências externas antes de interpretar entregas por pessoa ou equipe.";

export function parseMilestoneDeliveryDimension(
  raw: string | null | undefined,
): MilestoneDeliveryDimension {
  if (raw && (MILESTONE_DELIVERY_DIMENSIONS as readonly string[]).includes(raw)) {
    return raw as MilestoneDeliveryDimension;
  }
  return "equipe";
}

export function parseMilestoneDeliveryLimit(raw: string | null | undefined): number {
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) return DEFAULT_MILESTONE_DELIVERY_LIMIT;
  return Math.min(value, 50);
}

export function milestoneDeliveryDimensionToAggregate(
  dimension: MilestoneDeliveryDimension,
): AggregateDimension | null {
  if (dimension === "assignee") return null;
  return dimension;
}

export function sortMilestoneDeliveryRows(
  rows: MilestoneDeliveryRow[],
  order: string,
): MilestoneDeliveryRow[] {
  const sorted = [...rows];

  switch (order) {
    case "label_asc":
      return sorted.sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
    case "label_desc":
      return sorted.sort((a, b) => b.label.localeCompare(a.label, "pt-BR"));
    case "entregues_asc":
      return sorted.sort(
        (a, b) => a.entregues - b.entregues || a.label.localeCompare(b.label, "pt-BR"),
      );
    case "entregues_desc":
      return sorted.sort(
        (a, b) => b.entregues - a.entregues || a.label.localeCompare(b.label, "pt-BR"),
      );
    case "pontos_asc":
      return sorted.sort(
        (a, b) =>
          a.pontos_entregues - b.pontos_entregues || a.label.localeCompare(b.label, "pt-BR"),
      );
    case "pontos_desc":
      return sorted.sort(
        (a, b) =>
          b.pontos_entregues - a.pontos_entregues || a.label.localeCompare(b.label, "pt-BR"),
      );
    case "wip_asc":
      return sorted.sort(
        (a, b) => a.wip_restante - b.wip_restante || a.label.localeCompare(b.label, "pt-BR"),
      );
    case "wip_desc":
      return sorted.sort(
        (a, b) => b.wip_restante - a.wip_restante || a.label.localeCompare(b.label, "pt-BR"),
      );
    default:
      return sorted;
  }
}

/** Barras comparativas entregue × WIP para mini chart da seção. */
export function milestoneDeliveryToComparisonBars(rows: MilestoneDeliveryRow[]): {
  label: string;
  entregues: number;
  wip: number;
}[] {
  return rows
    .filter((row) => row.entregues > 0 || row.wip_restante > 0)
    .map((row) => ({
      label: row.label || NAO_INFORMADO,
      entregues: row.entregues,
      wip: row.wip_restante,
    }));
}

export function milestoneDeliveryMaxVolume(rows: MilestoneDeliveryRow[]): number {
  return rows.reduce(
    (max, row) => Math.max(max, row.entregues, row.wip_restante),
    0,
  );
}

export type MilestoneDeliveryDrilldownContext = Pick<
  MilestoneDetail,
  "titulo" | "start_date" | "due_date"
>;
