import { NextResponse } from "next/server";

import { saveAnalistaRelatorio } from "@/lib/dashboard/analistas";
import { getSessionUser } from "@/lib/supabase/session";
import type { AnalistaRelatorioStatus, SaveAnalistaRelatorioInput } from "@/types/analistas";

function isValidStatus(value: unknown): value is AnalistaRelatorioStatus {
  return value === "rascunho" || value === "publicado";
}

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let body: SaveAnalistaRelatorioInput;
  try {
    body = (await request.json()) as SaveAnalistaRelatorioInput;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (!body.anoMes?.trim()) {
    return NextResponse.json({ error: "Informe o mês de referência." }, { status: 400 });
  }

  if (body.status && !isValidStatus(body.status)) {
    return NextResponse.json({ error: "Status inválido." }, { status: 400 });
  }

  const result = await saveAnalistaRelatorio(user.id, {
    anoMes: body.anoMes,
    sprint: body.sprint,
    outrasAtividades: body.outrasAtividades ?? "",
    status: body.status ?? "rascunho",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ relatorio: result.relatorio });
}
