"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faExclamationTriangle,
  faInfoCircle,
  faTimes,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export type FeedbackVariant = "success" | "danger" | "warning" | "info";

type Props = {
  variant: FeedbackVariant;
  message: string;
  title?: string;
  /** `message` = bloco gov.br (`br-message`); `inline` = contextual (`feedback`) */
  mode?: "message" | "inline";
  onDismiss?: () => void;
  className?: string;
};

const DEFAULT_TITLES: Record<FeedbackVariant, string> = {
  success: "Sucesso.",
  danger: "Erro.",
  warning: "Atenção.",
  info: "Informação.",
};

const ICONS: Record<FeedbackVariant, IconDefinition> = {
  success: faCheckCircle,
  danger: faTimesCircle,
  warning: faExclamationTriangle,
  info: faInfoCircle,
};

export function SystemFeedback({
  variant,
  message,
  title,
  mode = "message",
  onDismiss,
  className = "",
}: Props) {
  const resolvedTitle = title ?? DEFAULT_TITLES[variant];
  const icon = ICONS[variant];
  const ariaLabel = `${resolvedTitle} ${message}`.trim();

  if (mode === "inline") {
    return (
      <p className={className}>
        <span className={`feedback ${variant}`} role="alert" aria-label={ariaLabel}>
          <FontAwesomeIcon icon={icon} aria-hidden />
          {message}
        </span>
      </p>
    );
  }

  return (
    <div className={`br-message ${variant} ${className}`.trim()} role="alert" aria-label={ariaLabel}>
      <div className="icon">
        <FontAwesomeIcon icon={icon} className="text-lg" aria-hidden />
      </div>
      <div className="content">
        <span className="message-title">{resolvedTitle}</span>
        <span className="message-body"> {message}</span>
      </div>
      {onDismiss ? (
        <div className="close">
          <button
            type="button"
            className="br-button circle small"
            aria-label="Fechar mensagem"
            onClick={onDismiss}
          >
            <FontAwesomeIcon icon={faTimes} aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  );
}
