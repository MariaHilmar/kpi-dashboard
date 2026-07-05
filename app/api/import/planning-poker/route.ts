import { NextResponse } from "next/server";

import { requireActiveSession } from "@/lib/auth/profile";
import {
  importPlanningPokerRows,
  loadPlanningPokerFromBuffer,
  validatePlanningPokerRows,
} from "@/lib/dashboard/planning-poker-import";
import { createAdminSupabase, isAdminApiConfigured } from "@/lib/supabase/admin";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const auth = await requireActiveSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  if (!isAdminApiConfigured()) {
    return NextResponse.json(
      { error: "Importação indisponível: SUPABASE_SERVICE_ROLE_KEY não configurada." },
      { status: 503 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Formulário inválido." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Selecione um arquivo .xlsx ou .csv." }, { status: 400 });
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "Arquivo excede o limite de 5 MB." }, { status: 400 });
  }

  const dryRun = formData.get("dryRun") === "true";
  const milestoneRaw = String(formData.get("milestoneId") ?? "").trim();
  let milestoneIid: number | null = null;
  if (milestoneRaw) {
    const parsed = Number(milestoneRaw);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return NextResponse.json(
        { error: "Milestone inválido (use o número da URL GitLab)." },
        { status: 400 },
      );
    }
    milestoneIid = parsed;
  }

  let rows;
  try {
    const buffer = await file.arrayBuffer();
    rows = await loadPlanningPokerFromBuffer(buffer, file.name);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao ler planilha.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "Nenhuma linha válida encontrada na planilha." }, { status: 400 });
  }

  const warnings = validatePlanningPokerRows(rows);

  if (dryRun) {
    return NextResponse.json({
      dry_run: true,
      rows: rows.length,
      warnings,
      sample: rows.slice(0, 3),
    });
  }

  const supabase = createAdminSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Cliente Supabase indisponível." }, { status: 503 });
  }

  try {
    const stats = await importPlanningPokerRows(supabase, rows, { milestoneIid });
    return NextResponse.json(stats);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha na importação.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
