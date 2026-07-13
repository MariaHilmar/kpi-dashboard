import { SystemFeedback } from "@/components/ui/SystemFeedback";
import type { DryRunResult } from "@/components/dados/import/types";

type ImportValidationResultProps = {
  result: DryRunResult;
};

export function ImportValidationResult({ result }: Readonly<ImportValidationResultProps>) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <SystemFeedback
        variant="success"
        title="Validação concluída"
        message={`${result.rows} ${result.rows === 1 ? "linha pronta" : "linhas prontas"} para importação.`}
      />
      {result.warnings.length > 0 ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-sm font-semibold text-amber-950">Avisos — revise antes de importar</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
            {result.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-600">
          Nenhum problema encontrado. Clique em <strong>Importar dados</strong> para aplicar as
          alterações.
        </p>
      )}
    </section>
  );
}
