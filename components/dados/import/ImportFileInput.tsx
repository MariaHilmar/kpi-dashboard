"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileArrowUp, faFileExcel, faXmark } from "@fortawesome/free-solid-svg-icons";

import { formatFileSize } from "@/components/dados/import/utils";

type ImportFileInputProps = {
  file: File | null;
  onChange: (file: File | null) => void;
};

export function ImportFileInput({ file, onChange }: Readonly<ImportFileInputProps>) {
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
