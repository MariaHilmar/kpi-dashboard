import { MilestoneDeliveryDimensionPanel } from "@/components/dashboard/milestone/MilestoneDeliveryDimensionPanel";
import { readSearchParam } from "@/lib/dashboard/search-params";
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

export async function MilestoneDeliveryByDimensionSection({
  milestone,
  deliveryDim,
  deliveryLimit,
  deliveryOrder,
}: Readonly<MilestoneDeliveryByDimensionSectionProps>) {
  const dimension = parseMilestoneDeliveryDimension(readSearchParam(deliveryDim));
  const limit = parseMilestoneDeliveryLimit(readSearchParam(deliveryLimit));
  const order = resolveSortOrder(
    readSearchParam(deliveryOrder),
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
