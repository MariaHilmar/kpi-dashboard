import { MilestoneDeliveryDimensionPanel } from "@/components/dashboard/milestone/MilestoneDeliveryDimensionPanel";
import {
  DEFAULT_MILESTONE_DELIVERY_ORDER,
  MILESTONE_DELIVERY_SORT_COLUMNS,
  parseMilestoneDeliveryDimension,
  parseMilestoneDeliveryLimit,
} from "@/lib/dashboard/milestone-delivery";
import {
  fetchMilestoneDeliveryByDimension,
  fetchMilestoneSummary,
  type MilestoneDetail,
} from "@/lib/dashboard/milestone-report";
import { resolveSortOrder } from "@/lib/dashboard/table-sort";

type MilestoneDeliveryByDimensionSectionProps = {
  milestone: MilestoneDetail;
  deliveryDim?: string | string[];
  deliveryLimit?: string | string[];
  deliveryOrder?: string | string[];
};

function readParam(value: string | string[] | undefined): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return null;
}

export async function MilestoneDeliveryByDimensionSection({
  milestone,
  deliveryDim,
  deliveryLimit,
  deliveryOrder,
}: Readonly<MilestoneDeliveryByDimensionSectionProps>) {
  const dimension = parseMilestoneDeliveryDimension(readParam(deliveryDim));
  const limit = parseMilestoneDeliveryLimit(readParam(deliveryLimit));
  const order = resolveSortOrder(
    readParam(deliveryOrder),
    MILESTONE_DELIVERY_SORT_COLUMNS,
    DEFAULT_MILESTONE_DELIVERY_ORDER,
  );

  const [rows, summary] = await Promise.all([
    fetchMilestoneDeliveryByDimension(milestone.gitlab_milestone_iid, dimension, limit),
    fetchMilestoneSummary(milestone.gitlab_milestone_iid),
  ]);

  const hasStoryPoints =
    rows.some((row) => row.pontos_entregues > 0 || row.wip_pontos > 0) ||
    (summary?.committed_story_points ?? 0) > 0;

  return (
    <MilestoneDeliveryDimensionPanel
      milestone={milestone}
      dimension={dimension}
      limit={limit}
      order={order}
      rows={rows}
      hasStoryPoints={hasStoryPoints}
    />
  );
}
