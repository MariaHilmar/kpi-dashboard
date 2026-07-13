"use client";

import { type FormEvent, useMemo, useState } from "react";

import {
  fileFingerprint,
  isDryRunResult,
} from "@/components/dados/import/utils";
import type { ImportLoadingMode, ImportResponse } from "@/components/dados/import/types";
import type { MilestoneOption } from "@/lib/dashboard/milestones";

type UsePlanningPokerImportOptions = {
  milestones: MilestoneOption[];
};

export function usePlanningPokerImport({ milestones }: UsePlanningPokerImportOptions) {
  const [file, setFile] = useState<File | null>(null);
  const [milestoneId, setMilestoneId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMode, setLoadingMode] = useState<ImportLoadingMode>(null);
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

  return {
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
  };
}
