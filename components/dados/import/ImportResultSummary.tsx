import { SystemFeedback } from "@/components/ui/SystemFeedback";
import type { PlanningPokerImportStats } from "@/lib/dashboard/planning-poker-import";

type ImportResultSummaryProps = {
  result: PlanningPokerImportStats;
};

export function ImportResultSummary({ result }: Readonly<ImportResultSummaryProps>) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <SystemFeedback
        variant={result.errors > 0 ? "warning" : "success"}
        title="Importação concluída"
        message={`${result.upserted_issues} de ${result.processed} ${result.processed === 1 ? "linha foi aplicada" : "linhas foram aplicadas"} nas issues.`}
      />
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Issues não encontradas
          </dt>
          <dd className="mt-1 text-lg font-semibold text-slate-900">
            {result.not_found_in_issues}
          </dd>
          <dd className="mt-0.5 text-xs text-slate-500">
            Confira repositório e número da issue no GitLab.
          </dd>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Registros na sprint
          </dt>
          <dd className="mt-1 text-lg font-semibold text-slate-900">
            {result.upserted_milestone_issues}
          </dd>
          <dd className="mt-0.5 text-xs text-slate-500">
            Preenchido quando uma sprint é selecionada.
          </dd>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Erros</dt>
          <dd className="mt-1 text-lg font-semibold text-slate-900">{result.errors}</dd>
        </div>
      </dl>
      {result.warnings.length > 0 ? (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-slate-800">Avisos</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
            {result.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
