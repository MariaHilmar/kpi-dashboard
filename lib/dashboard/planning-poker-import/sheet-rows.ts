import { mapHeaders } from "@/lib/dashboard/planning-poker-import/map-headers";
import { parseMappedRow } from "@/lib/dashboard/planning-poker-import/parse-row";
import type { PlanningPokerRow } from "@/lib/dashboard/planning-poker-import/types";

function rowHasValues(values: unknown[]): boolean {
  return values.some((value) => value !== null && value !== undefined && String(value).trim() !== "");
}

export function parseSheetRows(headers: string[], dataRows: unknown[][]): PlanningPokerRow[] {
  const mapping = mapHeaders(headers);
  if (!mapping.gitlab_iid) {
    throw new Error("Coluna gitlab_iid (ou id/iid) obrigatória no arquivo");
  }

  const rows: PlanningPokerRow[] = [];
  for (const values of dataRows) {
    if (!rowHasValues(values)) continue;

    const raw: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      const value = index < values.length ? values[index] : "";
      raw[header] = value === null || value === undefined ? "" : value;
    });

    const parsed = parseMappedRow(raw, mapping);
    if (parsed) rows.push(parsed);
  }

  return rows;
}
