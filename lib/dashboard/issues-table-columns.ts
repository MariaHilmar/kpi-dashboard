export type IssuesOptionalColumnKey =
  | "story_points"
  | "aceita"
  | "homologado"
  | "horas_estimada"
  | "horas_prevista"
  | "justificada"
  | "recorrente";

export type IssuesOptionalColumn = {
  key: IssuesOptionalColumnKey;
  label: string;
  sortKey?: string;
  align?: "left" | "right";
};

export const ISSUES_OPTIONAL_COLUMNS: readonly IssuesOptionalColumn[] = [
  { key: "story_points", label: "Pontos", sortKey: "pontos", align: "right" },
  { key: "aceita", label: "Aceita" },
  { key: "homologado", label: "Homologado" },
  { key: "horas_estimada", label: "Horas est.", align: "right" },
  { key: "horas_prevista", label: "Horas prev.", align: "right" },
  { key: "justificada", label: "Justificada" },
  { key: "recorrente", label: "Recorrente" },
] as const;

const VALID_KEYS = new Set<string>(ISSUES_OPTIONAL_COLUMNS.map((column) => column.key));

export function parseIssuesTableColumns(raw: string | null | undefined): IssuesOptionalColumnKey[] {
  if (!raw?.trim()) return [];

  const seen = new Set<IssuesOptionalColumnKey>();
  const columns: IssuesOptionalColumnKey[] = [];

  for (const part of raw.split(",")) {
    const key = part.trim();
    if (!VALID_KEYS.has(key) || seen.has(key as IssuesOptionalColumnKey)) continue;
    seen.add(key as IssuesOptionalColumnKey);
    columns.push(key as IssuesOptionalColumnKey);
  }

  return columns;
}

export function serializeIssuesTableColumns(columns: readonly IssuesOptionalColumnKey[]): string {
  return columns.join(",");
}

export function isIssuesOptionalColumnVisible(
  columns: readonly IssuesOptionalColumnKey[],
  key: IssuesOptionalColumnKey,
): boolean {
  return columns.includes(key);
}
