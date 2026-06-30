"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { FeedbackVariant } from "@/components/ui/SystemFeedback";

export type FeedbackState = {
  variant: FeedbackVariant;
  message: string;
  title?: string;
} | null;

type Options = {
  /** Fecha automaticamente mensagens de sucesso e informação (ms). 0 = desligado. */
  autoDismissMs?: number;
};

export function useSystemFeedback({ autoDismissMs = 8000 }: Options = {}) {
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setFeedback(null);
  }, []);

  const show = useCallback(
    (variant: FeedbackVariant, message: string, title?: string) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      setFeedback({ variant, message, title });

      const shouldAutoDismiss =
        autoDismissMs > 0 && (variant === "success" || variant === "info");
      if (shouldAutoDismiss) {
        timerRef.current = setTimeout(() => {
          setFeedback(null);
          timerRef.current = null;
        }, autoDismissMs);
      }
    },
    [autoDismissMs],
  );

  const showSuccess = useCallback(
    (message: string, title?: string) => show("success", message, title),
    [show],
  );
  const showError = useCallback(
    (message: string, title?: string) => show("danger", message, title),
    [show],
  );
  const showWarning = useCallback(
    (message: string, title?: string) => show("warning", message, title),
    [show],
  );
  const showInfo = useCallback(
    (message: string, title?: string) => show("info", message, title),
    [show],
  );

  useEffect(() => () => clear(), [clear]);

  return {
    feedback,
    show,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clear,
  };
}
