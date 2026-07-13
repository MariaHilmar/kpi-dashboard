import type { DryRunResult, ImportResponse } from "@/components/dados/import/types";

export function isDryRunResult(value: ImportResponse): value is DryRunResult {
  return "dry_run" in value && value.dry_run === true;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function fileFingerprint(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}
