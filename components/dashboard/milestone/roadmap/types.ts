import type {
  MilestoneRoadmapGroupBy,
  MilestoneRoadmapMetric,
  MilestoneRoadmapRow,
} from "@/lib/dashboard/milestone-roadmap";
import type { MilestoneOption } from "@/lib/dashboard/milestone-options";

export type MilestoneRoadmapPanelProps = {
  milestones: MilestoneOption[];
  fromIid: number;
  toIid: number;
  groupBy: MilestoneRoadmapGroupBy;
  metric: MilestoneRoadmapMetric;
  topN: number;
  selectedLabel: string | null;
  rows: MilestoneRoadmapRow[];
  hasStoryPoints: boolean;
};
