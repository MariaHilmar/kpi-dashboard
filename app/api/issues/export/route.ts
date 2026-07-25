import { NextResponse } from "next/server";

import { buildIssuesExportFilename, buildIssuesExportWorkbook } from "@/lib/dashboard/issues-export";
import { parseIssuesListParams } from "@/lib/dashboard/issues-page-params";
import { parseFilters } from "@/lib/dashboard/filters";
import { searchAllIssues } from "@/lib/dashboard/issues";
import { getSessionUser } from "@/lib/supabase/session";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const url = new URL(request.url);
  const filters = parseFilters(Object.fromEntries(url.searchParams.entries()));
  const { list } = parseIssuesListParams(url.searchParams);

  const { rows, total } = await searchAllIssues(filters, {
    search: list.search,
    estado: list.estado,
    sla: list.sla,
    faixaIdade: list.faixaIdade,
    autor: list.autor,
    criadoDe: list.criadoDe,
    criadoAte: list.criadoAte,
    fechadoDe: list.fechadoDe,
    fechadoAte: list.fechadoAte,
    mergeadoDe: list.mergeadoDe,
    mergeadoAte: list.mergeadoAte,
    order: list.order,
  });

  const buffer = await buildIssuesExportWorkbook(rows);
  const filename = buildIssuesExportFilename(total);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}
