/** Lê o primeiro valor de um parâmetro de URL do App Router (string ou array). */
export function readSearchParam(value: string | string[] | undefined): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return null;
}
