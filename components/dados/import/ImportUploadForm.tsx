"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faFileExcel } from "@fortawesome/free-solid-svg-icons";
import type { FormEvent } from "react";

import { ImportFileInput } from "@/components/dados/import/ImportFileInput";
import type { ImportLoadingMode } from "@/components/dados/import/types";
import { SystemFeedback } from "@/components/ui/SystemFeedback";
import type { MilestoneOption } from "@/lib/dashboard/milestones";

type ImportUploadFormProps = {
  milestones: MilestoneOption[];
  file: File | null;
  milestoneId: string;
  loading: boolean;
  loadingMode: ImportLoadingMode;
  canImport: boolean;
  selectedMilestone: MilestoneOption | undefined;
  onFileChange: (file: File | null) => void;
  onMilestoneChange: (milestoneId: string) => void;
  onValidate: (event: FormEvent<HTMLFormElement>) => void;
  onImport: () => void;
};

export function ImportUploadForm({
  milestones,
  file,
  milestoneId,
  loading,
  loadingMode,
  canImport,
  selectedMilestone,
  onFileChange,
  onMilestoneChange,
  onValidate,
  onImport,
}: Readonly<ImportUploadFormProps>) {
  return (
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

      <form onSubmit={onValidate} className="mt-6 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">Arquivo da planilha</span>
          <ImportFileInput file={file} onChange={onFileChange} />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="import-milestone" className="text-sm font-medium text-slate-700">
            Sprint vinculada <span className="font-normal text-slate-500">(opcional)</span>
          </label>
          <select
            id="import-milestone"
            className="br-select max-w-xl"
            value={milestoneId}
            onChange={(event) => onMilestoneChange(event.target.value)}
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
              {selectedMilestone ? ` para a sprint ${selectedMilestone.gitlab_milestone_iid}` : ""}
              .
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button type="submit" className="br-button secondary" disabled={loading || !file}>
            {loadingMode === "validate" ? "Validando…" : "Validar planilha"}
          </button>
          <button
            type="button"
            className="br-button primary"
            disabled={loading || !canImport}
            title={!canImport ? "Valide a planilha antes de importar" : undefined}
            onClick={onImport}
          >
            {loadingMode === "import" ? "Importando…" : "Importar dados"}
          </button>
        </div>
      </form>
    </section>
  );
}
