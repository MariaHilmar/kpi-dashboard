export function normalizeHeader(name: string): string {
  return (name ?? "").trim().toLowerCase();
}

export function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const text = String(value).replace(",", ".");
  const num = Number(text);
  return Number.isFinite(num) ? num : null;
}

export function parseIntValue(value: unknown): number | null {
  const num = parseNumber(value);
  if (num === null) return null;
  return Math.round(num);
}

export function parseText(value: unknown): string | null {
  const text = String(value ?? "").trim();
  return text || null;
}
