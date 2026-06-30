import { NextResponse } from "next/server";

import { buildAnalistaRelatorioWorkbook } from "@/lib/dashboard/analistas-export";
import { resolveAnalistaExportContext } from "@/lib/dashboard/analistas-export-context";
import { buildAnalistaExportFilename } from "@/lib/dashboard/analistas-utils";
import { TODOS } from "@/lib/dashboard/constants";
import { getSessionUser } from "@/lib/supabase/session";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const url = new URL(request.url);
  const result = await resolveAnalistaExportContext({
    userId: user.id,
    anoMesRaw: url.searchParams.get("anoMes"),
    sprintParam: url.searchParams.get("sprint") ?? TODOS,
    modulo: url.searchParams.get("modulo") ?? TODOS,
    autorParam: url.searchParams.get("autor"),
    requestedUserId: url.searchParams.get("userId"),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status });
  }

  const { analystName, anoMes, sprint, snapshot, outrasAtividades } = result.data;

  const buffer = await buildAnalistaRelatorioWorkbook({
    analystName,
    anoMes,
    sprint,
    snapshot,
    outrasAtividades,
  });

  const filename = buildAnalistaExportFilename(analystName, anoMes);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}
