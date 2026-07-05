"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faCircleInfo,
  faFileArrowUp,
  faFileExcel,
  faListCheck,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { type FormEvent, useMemo, useState } from "react";

import { SystemFeedback } from "@/components/ui/SystemFeedback";
import type { MilestoneOption } from "@/lib/dashboard/milestones";
import type { PlanningPokerImportStats } from "@/lib/dashboard/planning-poker-import";

type Props = {
  milestones: MilestoneOption[];
};

type DryRunResult = {
  dry_run: true;
  rows: number;
  warnings: string[];
  sample: Array<Record<string, unknown>>;
};

type ImportResponse = PlanningPokerImportStats | DryRunResult;

const PLANILHA_COLUNAS = [
  {
    coluna: "gitlab_repo",
    descricao: "Repositório da issue no GitLab",
    exemplo: "contratos_v2 ou contratos",
    obrigatoria: true,
  },
  {
    coluna: "gitlab_iid",
    descricao: "Número da issue no GitLab",
    exemplo: "1349 (sem #)",
    obrigatoria: true,
  },
  {
    coluna: "sprint",
    descricao: "Nome da sprint / milestone",
    exemplo: "Sprint 90 - Contratos",
    obrigatoria: false,
  },
  {
    coluna: "story_points",
    descricao: "Pontos definidos no Planning Poker",
    exemplo: "1, 2, 3, 5, 8, 13 ou 21",
    obrigatoria: false,
  },
  {
    coluna: "aceita",
    descricao: "Issue aceita pelo PO / equipe",
    exemplo: "Sim ou Não",
    obrigatoria: false,
  },
  {
    coluna: "historico_issue",
    descricao: "Issue classificada como histórico (Sim/Não)",
    exemplo: "Sim ou Não",
    obrigatoria: false,
  },
  {
    coluna: "recorrente",
    descricao: "Issue recorrente entre sprints",
    exemplo: "Sim ou Não",
    obrigatoria: false,
  },
  {
    coluna: "horas_estimada",
    descricao: "Horas estimadas para a issue",
    exemplo: "8 ou 8,5",
    obrigatoria: false,
  },
  {
    coluna: "horas prevista",
    descricao: "Horas previstas de entrega",
    exemplo: "10 ou 10,5",
    obrigatoria: false,
  },
  {
    coluna: "justificada",
    descricao: "Issue justificada no relatório",
    exemplo: "Sim ou Não",
    obrigatoria: false,
  },
  {
    coluna: "homologado",
    descricao: "Issue homologada pelo PO / cliente",
    exemplo: "Sim ou Não",
    obrigatoria: false,
  },
  {
    coluna: "historico",
    descricao: "Histórico / última observação da issue",
    exemplo: "Aguardando PO",
    obrigatoria: false,
  },
] as const;

const PASSOS = [
  "Baixe o template Excel ou use sua planilha do Planning Poker.",
  "Preencha repositório e número da issue em cada linha.",
  "Valide a planilha para conferir erros antes de salvar.",
  "Importe para atualizar as issues e, se escolher, o histórico da sprint.",
] as const;

function isDryRunResult(value: ImportResponse): value is DryRunResult {
  return "dry_run" in value && value.dry_run === true;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileFingerprint(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

interface FileInputProps {
  readonly file: File | null;
  readonly onChange: (file: File | null) => void;
}

function FileInput({ file, onChange }: FileInputProps) {
  if (file) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <FontAwesomeIcon icon={faFileExcel} className="shrink-0 text-blue-700" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">{file.name}</p>
            <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
          </div>
        </div>
        <button
          type="button"
          className="br-button circle small"
          aria-label="Remover arquivo"
          onClick={() => onChange(null)}
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>
    );
  }

  return (
    <label
      htmlFor="import-file"
      className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition hover:border-blue-400 hover:bg-blue-50/40"
    >
      <FontAwesomeIcon icon={faFileArrowUp} className="text-2xl text-blue-700" />
      <span className="text-sm font-medium text-slate-800">
        Clique para escolher ou arraste o arquivo aqui
      </span>
      <span className="text-xs text-slate-500">Excel (.xlsx) ou CSV</span>
      <input
        id="import-file"
        type="file"
        accept=".xlsx,.xlsm,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
        className="sr-only"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
    </label>
  );
}

interface ValidationResultProps {
  readonly result: DryRunResult;
}

function ValidationResult({ result }: ValidationResultProps) {
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

interface ImportResultProps {
  readonly result: PlanningPokerImportStats;
}

function ImportResult({ result }: ImportResultProps) {
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

export function ImportarDadosPanel({ milestones }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [milestoneId, setMilestoneId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMode, setLoadingMode] = useState<"validate" | "import" | null>(null);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validatedFingerprint, setValidatedFingerprint] = useState<string | null>(null);

  const canImport = Boolean(file && validatedFingerprint === fileFingerprint(file));

  const selectedMilestone = useMemo(
    () => milestones.find((m) => String(m.gitlab_milestone_iid ?? "") === milestoneId),
    [milestones, milestoneId],
  );

  function resetFileState(nextFile: File | null) {
    setFile(nextFile);
    setResult(null);
    setError(null);
    setValidatedFingerprint(null);
  }

  async function submitImport(dryRun: boolean) {
    setError(null);
    setResult(null);

    if (!file) {
      setError("Selecione um arquivo .xlsx ou .csv.");
      return;
    }

    setLoading(true);
    setLoadingMode(dryRun ? "validate" : "import");

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("dryRun", dryRun ? "true" : "false");
      if (milestoneId) formData.set("milestoneId", milestoneId);

      const response = await fetch("/api/import/planning-poker", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as ImportResponse & { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao processar a planilha.");
      }

      setResult(data);

      if (dryRun && isDryRunResult(data)) {
        setValidatedFingerprint(fileFingerprint(file));
      }

      if (!dryRun && !isDryRunResult(data)) {
        setValidatedFingerprint(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
      setLoadingMode(null);
    }
  }

  function handleValidate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitImport(true);
  }

  function handleImport() {
    void submitImport(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex flex-col gap-6">
        <section className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 sm:p-5">
          <div className="flex gap-3">
            <FontAwesomeIcon icon={faCircleInfo} className="mt-0.5 shrink-0 text-blue-700" />
            <div className="space-y-2 text-sm text-slate-700">
              <p className="font-medium text-slate-900">Como funciona</p>
              <ol className="list-decimal space-y-1.5 pl-4">
                {PASSOS.map((passo) => (
                  <li key={passo}>{passo}</li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Enviar planilha</h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">
                Baixe o template, preencha as informações e faça o upload para importar os dados.
                <br />
                Formatos aceitos: <strong>.xlsx</strong> e <strong>.csv</strong> (até 5 MB).
              </p>
            </div>
            <a
              href="/api/import/planning-poker/template"
              className="br-button secondary small inline-flex items-center gap-2"
              download="planning_poker_import.xlsx"
            >
              <FontAwesomeIcon icon={faFileExcel} />
              Baixar template
            </a>
          </div>

          <form onSubmit={handleValidate} className="mt-6 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700">Arquivo da planilha</span>
              <FileInput file={file} onChange={resetFileState} />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="import-milestone" className="text-sm font-medium text-slate-700">
                Sprint vinculada <span className="font-normal text-slate-500">(opcional)</span>
              </label>
              <select
                id="import-milestone"
                className="br-select max-w-xl"
                value={milestoneId}
                onChange={(event) => setMilestoneId(event.target.value)}
              >
                <option value="">Atualizar somente as issues</option>
                {milestones.map((milestone) => (
                  <option key={milestone.id} value={milestone.gitlab_milestone_iid ?? ""}>
                    {milestone.gitlab_milestone_iid != null
                      ? `Sprint ${milestone.gitlab_milestone_iid} — ${milestone.titulo}`
                      : milestone.titulo}
                  </option>
                ))}
              </select>
              <p className="text-xs leading-relaxed text-slate-500">
                {selectedMilestone
                  ? `Os dados também serão registrados no histórico da sprint ${selectedMilestone.gitlab_milestone_iid}.`
                  : "Sem sprint selecionada, apenas os campos das issues serão atualizados — útil para corrigir pontos fora de uma sprint específica."}
              </p>
            </div>

            {file && !canImport ? (
              <SystemFeedback
                variant="info"
                mode="inline"
                title="Próximo passo"
                message="Valide a planilha antes de importar. A validação verifica colunas, linhas duplicadas e valores fora do padrão, sem alterar nenhum dado."
              />
            ) : null}

            {canImport ? (
              <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                <FontAwesomeIcon icon={faCheckCircle} className="mt-0.5 shrink-0" />
                <p>
                  Planilha validada com sucesso. Você pode importar os dados agora
                  {selectedMilestone
                    ? ` para a sprint ${selectedMilestone.gitlab_milestone_iid}`
                    : ""}
                  .
                </p>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="br-button secondary"
                disabled={loading || !file}
              >
                {loadingMode === "validate" ? "Validando…" : "Validar planilha"}
              </button>
              <button
                type="button"
                className="br-button primary"
                disabled={loading || !canImport}
                title={!canImport ? "Valide a planilha antes de importar" : undefined}
                onClick={handleImport}
              >
                {loadingMode === "import" ? "Importando…" : "Importar dados"}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm sm:p-6">
          <h2 className="font-semibold text-slate-900">O que é atualizado?</h2>
          <ul className="mt-3 list-disc space-y-2 pl-4">
            <li>
              Story points e campos de relatório ( aceita, historico_issue, recorrente,
              horas_estimada, horas prevista, justificada, homologado e historico) nas issues já sincronizadas
              do GitLab.
            </li>
            <li>
              Com sprint selecionada, um snapshot da planilha fica disponível para relatórios
              históricos da milestone.
            </li>
            <li>
              Issues que ainda não existem no sistema são ignoradas — sincronize o GitLab antes, se
              necessário.
            </li>
          </ul>
        </section>

        {error ? <SystemFeedback variant="danger" message={error} /> : null}

        {result && isDryRunResult(result) ? <ValidationResult result={result} /> : null}

        {result && !isDryRunResult(result) ? (
          <ImportResult result={result} />
        ) : null}
      </div>

      <aside className="flex flex-col gap-4">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faListCheck} className="text-blue-700" />
            <h2 className="text-base font-semibold text-slate-900">Colunas da planilha</h2>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            O template já traz os cabeçalhos corretos. Você também pode usar nomes alternativos como{" "}
            <em>Repositório</em>, <em>ID</em> ou <em>Pontos</em>.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-2 pr-2 font-medium">Coluna</th>
                  <th className="pb-2 font-medium">Significado</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {PLANILHA_COLUNAS.map((item) => (
                  <tr key={item.coluna} className="border-b border-slate-100 align-top">
                    <td className="py-2.5 pr-2">
                      <code className="text-xs text-blue-800">{item.coluna}</code>
                      {item.obrigatoria ? (
                        <span className="ml-1 text-[10px] font-semibold uppercase text-rose-600">
                          obrig.
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2.5">
                      <span className="block">{item.descricao}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">Ex.: {item.exemplo}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </aside>
    </div>
  );
}
