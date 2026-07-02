import { NextResponse } from "next/server";

import { fetchFilterOptions } from "@/lib/dashboard/fetchers";
import {
  buildParceriasExportFilename,
  buildParceriasExportWorkbook,
} from "@/lib/dashboard/parcerias-export";
import { fetchParceriasIssues } from "@/lib/dashboard/parcerias";
import { parseParceriasParams } from "@/lib/dashboard/parcerias-config";
import { getSessionUser } from "@/lib/supabase/session";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const url = new URL(request.url);
  const filterOptions = await fetchFilterOptions();
  const params = parseParceriasParams(
    Object.fromEntries(url.searchParams.entries()),
    filterOptions.parcerias,
  );
  const { rows, total } = await fetchParceriasIssues(params);

  const buffer = await buildParceriasExportWorkbook({
    parceiro: params.parceiro,
    fechadoDe: params.fechadoDe,
    fechadoAte: params.fechadoAte,
    rows,
  });
  const filename = buildParceriasExportFilename(params.parceiro, total);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}
