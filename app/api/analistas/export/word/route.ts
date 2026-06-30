import { NextResponse } from "next/server";

import { buildAnalistaRelatorioDocx } from "@/lib/dashboard/analistas-export-word";
import { resolveAnalistaExportContext } from "@/lib/dashboard/analistas-export-context";
import { buildAnalistaWordExportFilename } from "@/lib/dashboard/analistas-utils";
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

  const buffer = await buildAnalistaRelatorioDocx({
    analystName,
    anoMes,
    sprint,
    snapshot,
    outrasAtividades,
  });

  const filename = buildAnalistaWordExportFilename(analystName, anoMes);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}
