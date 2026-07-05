import { MilestoneCapacitySection } from "@/components/dashboard/milestone/MilestoneCapacitySection";
import type { MilestoneOption } from "@/lib/dashboard/milestones";

type MilestoneTendenciasSectionProps = {
  milestones: MilestoneOption[];
  /** Sprint em foco na página — define janela padrão (anterior → atual) quando from/to ausentes. */
  anchorIid?: number | null;
  fromRaw?: string | string[];
  toRaw?: string | string[];
  metricRaw?: string | string[];
  teamRaw?: string | string[];
};

export async function MilestoneTendenciasSection({
  milestones,
  anchorIid,
  fromRaw,
  toRaw,
  metricRaw,
  teamRaw,
}: Readonly<MilestoneTendenciasSectionProps>) {
  return (
    <div className="flex flex-col gap-4 border-t border-slate-200 pt-8">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          Tendências entre sprints
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Capacidade por equipe sprint a sprint — issues fechadas (KPI Sprint) ou pontos entregues no
          intervalo de cada milestone.
        </p>
      </div>

      <MilestoneCapacitySection
        milestones={milestones}
        anchorIid={anchorIid}
        fromRaw={fromRaw}
        toRaw={toRaw}
        metricRaw={metricRaw}
        teamRaw={teamRaw}
      />
    </div>
  );
}
