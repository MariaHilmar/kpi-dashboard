import { KpiCard } from "@/components/dashboard/KpiCard";
import type { StoryPointsKpis } from "@/lib/dashboard/story-points-kpis";
import { formatNumber } from "@/lib/format";

type Props = {
  kpis: StoryPointsKpis | null;
};

export function SprintStoryPointsStrip({ kpis }: Props) {
  if (!kpis) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
        KPIs de story points indisponíveis. Execute a migration 046 no Supabase.
      </div>
    );
  }

  const hasAnyPoints = kpis.pontos_abertos > 0 || kpis.pontos_fechados > 0;

  return (
    <section aria-label="Story points da sprint">
      <h3 className="mb-2 text-sm font-semibold text-slate-700">Story points</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard
          label="Pontos abertos"
          value={formatNumber(kpis.pontos_abertos)}
          accent="warning"
          hint="Soma de story_points em issues abertas"
        />
        <KpiCard
          label="Pontos fechados"
          value={formatNumber(kpis.pontos_fechados)}
          accent="success"
          hint="Soma de story_points em issues fechadas"
        />
        <KpiCard
          label="Issues sem ponto"
          value={formatNumber(kpis.issues_sem_pontos)}
          accent={kpis.issues_sem_pontos > 0 ? "danger" : undefined}
          hint="Issues sem story_points no recorte"
        />
      </div>
      {!hasAnyPoints && kpis.issues_sem_pontos === 0 ? (
        <p className="mt-2 text-xs text-slate-500">
          Nenhum story point registrado neste recorte. Importe via{" "}
          <a href="/importar-dados" className="text-govbr-blue hover:underline">
            Importar dados
          </a>
          .
        </p>
      ) : null}
    </section>
  );
}
