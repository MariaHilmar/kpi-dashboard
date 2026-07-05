import ExcelJS from "exceljs";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  makeIssueKeyFromParts,
  normalizeGitlabRepoSlug,
  repoDisplayName,
} from "@/lib/dashboard/gitlab-url";

export const TEMPLATE_HEADERS = [
  "gitlab_repo",
  "gitlab_iid",
  "sprint",
  "story_points",
  "aceita",
  "historico_issue",
  "recorrente",
  "horas_estimada",
  "horas prevista",
  "justificada",
  "homologado",
  "historico",
] as const;

const COLUMN_ALIASES: Record<string, readonly string[]> = {
  gitlab_repo: ["gitlab_repo", "repositorio", "repo"],
  gitlab_iid: ["gitlab_iid", "iid", "id", "issue_id", "#"],
  sprint: ["sprint", "milestone"],
  story_points: ["story_points", "pontos", "peso", "weight", "story points"],
  aceita: ["aceita"],
  justificada: ["justificada"],
  historico: ["historico_issue"],
  recorrente: ["recorrente"],
  horas_estimada: ["horas_estimada", "horas estimada"],
  horas_prevista: ["horas_prevista", "horas prevista"],
  homologado: ["homologado", "homologado?"],
  ultimo_comentario: ["historico"],
};

const FIBONACCI = new Set([1, 2, 3, 5, 8, 13, 21]);

export type PlanningPokerRow = {
  issue_key: string;
  gitlab_repo: string;
  gitlab_iid: number;
  sprint?: string | null;
  story_points?: number | null;
  aceita?: string | null;
  justificada?: string | null;
  historico?: string | null;
  recorrente?: string | null;
  horas_estimada?: number | null;
  horas_prevista?: number | null;
  homologado?: string | null;
  ultimo_comentario?: string | null;
};

export type PlanningPokerImportStats = {
  processed: number;
  upserted_issues: number;
  not_found_in_issues: number;
  upserted_milestone_issues: number;
  errors: number;
  warnings: string[];
};

function normalizeHeader(name: string): string {
  return (name ?? "").trim().toLowerCase();
}

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

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const text = String(value).replace(",", ".");
  const num = Number(text);
  return Number.isFinite(num) ? num : null;
}

function parseIntValue(value: unknown): number | null {
  const num = parseNumber(value);
  if (num === null) return null;
  return Math.round(num);
}

function parseText(value: unknown): string | null {
  const text = String(value ?? "").trim();
  return text || null;
}

export function parseMappedRow(
  raw: Record<string, unknown>,
  mapping: Record<string, string>,
): PlanningPokerRow | null {
  const iid = parseIntValue(raw[mapping.gitlab_iid]);
  if (!iid) return null;

  const repoRaw = mapping.gitlab_repo ? raw[mapping.gitlab_repo] : "contratos_v2";
  const slug = normalizeGitlabRepoSlug(String(repoRaw ?? "contratos_v2")) ?? "contratos_v2";

  const row: PlanningPokerRow = {
    issue_key: makeIssueKeyFromParts(slug, iid),
    gitlab_repo: slug,
    gitlab_iid: iid,
  };

  if (mapping.story_points) {
    row.story_points = parseIntValue(raw[mapping.story_points]);
  }
  if (mapping.sprint) {
    row.sprint = parseText(raw[mapping.sprint]);
  }

  for (const field of ["aceita", "justificada", "historico", "recorrente", "homologado"] as const) {
    if (mapping[field]) {
      row[field] = parseText(raw[mapping[field]]);
    }
  }

  for (const field of ["horas_estimada", "horas_prevista"] as const) {
    if (mapping[field]) {
      row[field] = parseNumber(raw[mapping[field]]);
    }
  }

  if (mapping.ultimo_comentario) {
    row.ultimo_comentario = parseText(raw[mapping.ultimo_comentario]);
  }

  return row;
}

export function validatePlanningPokerRows(rows: PlanningPokerRow[]): string[] {
  const warnings: string[] = [];
  const seen = new Set<string>();

  rows.forEach((row, index) => {
    const line = index + 2;
    if (seen.has(row.issue_key)) {
      warnings.push(`Linha ${line}: issue duplicada ${row.issue_key}`);
    }
    seen.add(row.issue_key);

    const points = row.story_points;
    if (points != null && !FIBONACCI.has(points)) {
      warnings.push(
        `Linha ${line}: story_points=${points} fora da escala Fibonacci comum ${[...FIBONACCI].sort((a, b) => a - b).join(", ")}`,
      );
    }
  });

  return warnings;
}

function rowHasValues(values: unknown[]): boolean {
  return values.some((value) => value !== null && value !== undefined && String(value).trim() !== "");
}

function parseSheetRows(headers: string[], dataRows: unknown[][]): PlanningPokerRow[] {
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

export async function loadPlanningPokerFromBuffer(
  buffer: ArrayBuffer,
  filename: string,
): Promise<PlanningPokerRow[]> {
  const suffix = filename.split(".").pop()?.toLowerCase() ?? "";

  if (suffix === "csv") {
    const text = new TextDecoder("utf-8").decode(buffer).replace(/^\uFEFF/, "");
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length === 0) throw new Error("CSV vazio");

    const headers = lines[0].split(",").map((cell) => cell.trim());
    const dataRows = lines.slice(1).map((line) => line.split(",").map((cell) => cell.trim()));
    return parseSheetRows(headers, dataRows);
  }

  if (suffix === "xlsx" || suffix === "xlsm") {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) throw new Error("Excel sem planilhas");

    const headerRow = sheet.getRow(1);
    const rawHeaderValues = headerRow.values;
    const headerCells = Array.isArray(rawHeaderValues) ? rawHeaderValues.slice(1) : [];
    const headers = headerCells
      .map((cell) => String(cell ?? "").trim())
      .filter(Boolean);

    if (headers.length === 0) throw new Error("Excel sem cabeçalho na primeira linha");

    const dataRows: unknown[][] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const rawRowValues = row.values;
      const values = (Array.isArray(rawRowValues) ? rawRowValues.slice(1) : []).map((cell) => {
        if (cell && typeof cell === "object" && "result" in cell) {
          return (cell as ExcelJS.CellFormulaValue).result ?? "";
        }
        return cell ?? "";
      });
      dataRows.push(values);
    });

    return parseSheetRows(headers, dataRows);
  }

  throw new Error("Formato não suportado (use .xlsx ou .csv)");
}

export async function buildPlanningPokerTemplateWorkbook(): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MGI KPI Dashboard";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Planning Poker");
  const headerFill: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1351B4" },
  };

  TEMPLATE_HEADERS.forEach((header, index) => {
    const cell = sheet.getCell(1, index + 1);
    cell.value = header;
    cell.fill = headerFill;
    cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
  });

  const examples: (string | number)[][] = [
    ["contratos_v2", 1349, "Sprint 91 - Contratos", 5, "Sim", "Não", "Não", 8, 10, "Sim", "Não", ""],
    ["contratos", 2617, "Sprint 90 - Contratos", 3, "Sim", "Não", "Não", 4, 6, "Não", "Não", "Aguardando PO"],
  ];

  examples.forEach((example, rowIndex) => {
    example.forEach((value, colIndex) => {
      sheet.getCell(rowIndex + 2, colIndex + 1).value = value;
    });
  });

  sheet.getColumn(1).width = 14;
  sheet.getColumn(2).width = 12;
  sheet.getColumn(3).width = 28;
  sheet.getColumn(12).width = 36;

  const help = workbook.addWorksheet("Instrucoes");
  const helpLines = [
    "Planning Poker — importação MGI",
    "",
    "Colunas obrigatórias: gitlab_repo, gitlab_iid",
    "Coluna principal: story_points (resultado da votação)",
    "",
    "gitlab_repo: contratos_v2 ou contratos",
    "gitlab_iid: número da issue no GitLab (#1349 → 1349)",
    "sprint: título do milestone (opcional)",
    "",
    "Importar pelo dashboard: Dados → Importar Dados",
  ];
  helpLines.forEach((line, index) => {
    help.getCell(index + 1, 1).value = line;
  });
  help.getColumn(1).width = 72;

  return workbook.xlsx.writeBuffer();
}

function utcNowIso(): string {
  return new Date().toISOString();
}

function issuePatchFromRow(row: PlanningPokerRow, milestoneIid: number | null): Record<string, unknown> {
  const patch: Record<string, unknown> = {
    story_points: row.story_points,
    aceita: row.aceita,
    justificada: row.justificada,
    historico: row.historico,
    recorrente: row.recorrente,
    horas_estimada: row.horas_estimada,
    horas_prevista: row.horas_prevista,
    homologado: row.homologado,
    ultimo_comentario: row.ultimo_comentario,
    report_fields_synced_at: utcNowIso(),
  };

  if (row.sprint) patch.sprint = row.sprint;
  if (milestoneIid != null) patch.milestone_gitlab_id = milestoneIid;

  return Object.fromEntries(Object.entries(patch).filter(([, value]) => value != null));
}

function repoMatchValues(slug: string): string[] {
  const display = repoDisplayName(slug);
  return [...new Set([slug, display])];
}

async function findIssueKey(
  supabase: SupabaseClient,
  row: PlanningPokerRow,
): Promise<string | null> {
  const repos = repoMatchValues(row.gitlab_repo);

  for (const repo of repos) {
    const { data, error } = await supabase
      .from("issues")
      .select("issue_key")
      .eq("gitlab_iid", row.gitlab_iid)
      .eq("gitlab_repo", repo)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    if (data?.issue_key) return data.issue_key as string;
  }

  const { data: byKey } = await supabase
    .from("issues")
    .select("issue_key")
    .eq("issue_key", row.issue_key)
    .limit(1)
    .maybeSingle();

  return (byKey?.issue_key as string | undefined) ?? null;
}

async function resolveMilestoneUuid(
  supabase: SupabaseClient,
  milestoneIid: number,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("milestones")
    .select("id")
    .eq("gitlab_milestone_iid", milestoneIid)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data?.id as string | undefined) ?? null;
}

export async function importPlanningPokerRows(
  supabase: SupabaseClient,
  rows: PlanningPokerRow[],
  options: { milestoneIid?: number | null } = {},
): Promise<PlanningPokerImportStats> {
  const warnings = validatePlanningPokerRows(rows);
  const milestoneIid = options.milestoneIid ?? null;

  const { data: runRow, error: runError } = await supabase
    .from("milestone_import_runs")
    .insert({
      source: "excel_planning_poker",
      milestone_gitlab_id: milestoneIid,
      status: "running",
    })
    .select("id")
    .single();

  if (runError || !runRow) {
    throw new Error(runError?.message ?? "Falha ao registrar importação");
  }

  const runId = runRow.id as string;
  let processed = 0;
  let upsertedIssues = 0;
  let notFound = 0;
  let errors = 0;

  let milestoneUuid: string | null = null;
  if (milestoneIid != null) {
    milestoneUuid = await resolveMilestoneUuid(supabase, milestoneIid);
  }

  const milestoneIssueRows: Record<string, unknown>[] = [];

  for (const row of rows) {
    processed += 1;
    const patch = issuePatchFromRow(row, milestoneIid);

    try {
      const issueKey = await findIssueKey(supabase, row);
      if (!issueKey || Object.keys(patch).length === 0) {
        notFound += 1;
      } else {
        const { error: patchError } = await supabase.from("issues").update(patch).eq("issue_key", issueKey);
        if (patchError) {
          errors += 1;
        } else {
          upsertedIssues += 1;
        }
      }

      if (milestoneUuid) {
        milestoneIssueRows.push({
          milestone_id: milestoneUuid,
          issue_key: issueKey ?? row.issue_key,
          gitlab_repo: row.gitlab_repo,
          gitlab_iid: row.gitlab_iid,
          story_points: row.story_points,
          aceita: row.aceita,
          justificada: row.justificada,
          historico: row.historico,
          recorrente: row.recorrente,
          horas_estimada: row.horas_estimada,
          horas_prevista: row.horas_prevista,
          homologado: row.homologado,
          ultimo_comentario: row.ultimo_comentario,
          imported_at: utcNowIso(),
          import_source: "excel_planning_poker",
        });
      }
    } catch {
      errors += 1;
    }
  }

  let upsertedMilestoneIssues = 0;
  if (milestoneIssueRows.length > 0) {
    const chunkSize = 100;
    for (let start = 0; start < milestoneIssueRows.length; start += chunkSize) {
      const batch = milestoneIssueRows.slice(start, start + chunkSize);
      const { error: miError } = await supabase
        .from("milestone_issues")
        .upsert(batch, { onConflict: "milestone_id,issue_key" });
      if (miError) {
        errors += batch.length;
      } else {
        upsertedMilestoneIssues += batch.length;
      }
    }
  }

  const status = errors === 0 ? "success" : "partial";
  await supabase
    .from("milestone_import_runs")
    .update({
      status,
      rows_processed: processed,
      rows_upserted: upsertedIssues,
      rows_error: errors + notFound,
      message: `milestone_iid=${milestoneIid ?? "null"}, mi=${upsertedMilestoneIssues}`,
      finished_at: utcNowIso(),
    })
    .eq("id", runId);

  return {
    processed,
    upserted_issues: upsertedIssues,
    not_found_in_issues: notFound,
    upserted_milestone_issues: upsertedMilestoneIssues,
    errors,
    warnings,
  };
}
