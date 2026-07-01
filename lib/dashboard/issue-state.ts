/** Valores de `issues.estado` vindos do pipeline (PT) e do GitLab (EN). */
const OPEN_ESTADOS = new Set(["open", "opened", "aberto"]);
const CLOSED_ESTADOS = new Set(["closed", "fechado"]);

export function isIssueOpen(
  estado: string | null | undefined,
  aberto?: boolean | null,
): boolean {
  if (typeof aberto === "boolean") return aberto;
  if (!estado) return false;
  return OPEN_ESTADOS.has(estado.trim().toLowerCase());
}

export function issueEstadoLabel(
  estado: string | null | undefined,
  aberto?: boolean | null,
): "Aberta" | "Fechada" {
  return isIssueOpen(estado, aberto) ? "Aberta" : "Fechada";
}

export function isKnownClosedEstado(estado: string | null | undefined): boolean {
  if (!estado) return false;
  return CLOSED_ESTADOS.has(estado.trim().toLowerCase());
}
