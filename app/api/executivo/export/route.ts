import { NextResponse } from "next/server";

import { fetchExecutivoDataset } from "@/lib/dashboard/executivo-dataset";
import {
  buildExecutivoExportFilename,
  buildExecutivoExportWorkbook,
} from "@/lib/dashboard/executivo-export";
import { parseFilters } from "@/lib/dashboard/filters";
import { getSessionUser } from "@/lib/supabase/session";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const url = new URL(request.url);
  const filters = parseFilters(Object.fromEntries(url.searchParams.entries()));
  const dataset = await fetchExecutivoDataset(filters);

  const buffer = await buildExecutivoExportWorkbook(dataset);
  const filename = buildExecutivoExportFilename();

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}
