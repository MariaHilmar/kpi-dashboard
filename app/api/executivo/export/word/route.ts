import { NextResponse } from "next/server";

import { fetchExecutivoDataset } from "@/lib/dashboard/executivo-dataset";
import {
  buildExecutivoRelatorioDocx,
  buildExecutivoWordFilename,
} from "@/lib/dashboard/executivo-export-word";
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

  const buffer = await buildExecutivoRelatorioDocx(dataset);
  const filename = buildExecutivoWordFilename();

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}
