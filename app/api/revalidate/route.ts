import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { timingSafeEqualString } from "@/lib/auth/timing-safe";
import { CACHE_TAG_KPIS } from "@/lib/dashboard/cache";

/**
 * POST /api/revalidate
 *
 * Invalida o cache de KPIs do dashboard.
 * Chamado pelo pipeline (sync_supabase.py) após cada sync bem-sucedido.
 *
 * Headers obrigatórios:
 *   Authorization: Bearer <REVALIDATE_SECRET>
 *
 * Resposta:
 *   200 { revalidated: true, tag: "kpis" }
 *   401 { error: "Não autorizado." }
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;

  if (!secret) {
    console.error("REVALIDATE_SECRET não configurado.");
    return NextResponse.json({ error: "Servidor mal configurado." }, { status: 500 });
  }

  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (!timingSafeEqualString(token, secret)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  revalidateTag(CACHE_TAG_KPIS, "max");

  return NextResponse.json({ revalidated: true, tag: CACHE_TAG_KPIS });
}
