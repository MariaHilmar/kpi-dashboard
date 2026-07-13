import { COLUMN_ALIASES } from "@/lib/dashboard/planning-poker-import/constants";
import { normalizeHeader } from "@/lib/dashboard/planning-poker-import/value-parsers";

export function mapHeaders(headers: string[]): Record<string, string> {
  const mapped: Record<string, string> = {};
  const normalizedAliases = Object.fromEntries(
    Object.entries(COLUMN_ALIASES).map(([field, aliases]) => [
      field,
      new Set(aliases.map(normalizeHeader)),
    ]),
  ) as Record<string, Set<string>>;

  for (const header of headers) {
    const key = normalizeHeader(header);
    for (const [field, aliases] of Object.entries(normalizedAliases)) {
      if (aliases.has(key) && !(field in mapped)) {
        mapped[field] = header;
        break;
      }
    }
  }

  return mapped;
}
