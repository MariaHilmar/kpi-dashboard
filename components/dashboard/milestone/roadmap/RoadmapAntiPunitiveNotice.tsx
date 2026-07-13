import { MILESTONE_ROADMAP_ANTI_PUNITIVE_NOTE } from "@/lib/dashboard/milestone-roadmap";

export function RoadmapAntiPunitiveNotice() {
  return (
    <div className="mb-4 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-950">
      {MILESTONE_ROADMAP_ANTI_PUNITIVE_NOTE}
    </div>
  );
}
