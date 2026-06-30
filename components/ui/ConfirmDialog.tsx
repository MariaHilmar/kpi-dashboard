"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

type Props = {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "danger";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  confirmVariant = "primary",
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="br-scrim foco active" data-scrim="true">
      <div
        className="br-modal medium"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="br-modal-header">
          <div className="modal-title" id={titleId}>
            {title}
          </div>
          <button
            type="button"
            className="br-button close circle"
            aria-label="Fechar"
            disabled={loading}
            onClick={onCancel}
          >
            <FontAwesomeIcon icon={faTimes} aria-hidden />
          </button>
        </div>

        <div className="br-modal-body">{children}</div>

        <div className="br-modal-footer justify-content-end">
          <button
            ref={cancelRef}
            type="button"
            className="br-button secondary"
            disabled={loading}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`br-button ${confirmVariant === "danger" ? "danger" : "primary"} ml-2`}
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? "Processando…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
