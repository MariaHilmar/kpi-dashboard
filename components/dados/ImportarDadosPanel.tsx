"use client";

import { ImportHowItWorks } from "@/components/dados/import/ImportHowItWorks";
import { ImportPlanilhaColumns } from "@/components/dados/import/ImportPlanilhaColumns";
import { ImportResultSummary } from "@/components/dados/import/ImportResultSummary";
import { ImportUploadForm } from "@/components/dados/import/ImportUploadForm";
import { ImportValidationResult } from "@/components/dados/import/ImportValidationResult";
import { ImportWhatIsUpdated } from "@/components/dados/import/ImportWhatIsUpdated";
import { SystemFeedback } from "@/components/ui/SystemFeedback";
import { usePlanningPokerImport } from "@/hooks/usePlanningPokerImport";
import type { MilestoneOption } from "@/lib/dashboard/milestones";

type ImportarDadosPanelProps = {
  milestones: MilestoneOption[];
};

export function ImportarDadosPanel({ milestones }: Readonly<ImportarDadosPanelProps>) {
  const {
    file,
    milestoneId,
    loading,
    loadingMode,
    result,
    error,
    canImport,
    selectedMilestone,
    setMilestoneId,
    resetFileState,
    handleValidate,
    handleImport,
    isDryRunResult,
  } = usePlanningPokerImport({ milestones });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex flex-col gap-6">
        <ImportHowItWorks />

        <ImportUploadForm
          milestones={milestones}
          file={file}
          milestoneId={milestoneId}
          loading={loading}
          loadingMode={loadingMode}
          canImport={canImport}
          selectedMilestone={selectedMilestone}
          onFileChange={resetFileState}
          onMilestoneChange={setMilestoneId}
          onValidate={handleValidate}
          onImport={handleImport}
        />

        <ImportWhatIsUpdated />

        {error ? <SystemFeedback variant="danger" message={error} /> : null}

        {result && isDryRunResult(result) ? <ImportValidationResult result={result} /> : null}

        {result && !isDryRunResult(result) ? <ImportResultSummary result={result} /> : null}
      </div>

      <ImportPlanilhaColumns />
    </div>
  );
}
