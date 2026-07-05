import { NextResponse } from "next/server";

import { fetchMilestoneDetail, fetchMilestoneIssues } from "@/lib/dashboard/milestone-report";
import { getSessionUser } from "@/lib/supabase/session";

function parsePositiveInt(raw: string | null, fallback: number): number {
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const url = new URL(request.url);
  const iidRaw = url.searchParams.get("iid");
  const milestoneIid = iidRaw ? Number(iidRaw) : NaN;

  if (!Number.isInteger(milestoneIid) || milestoneIid <= 0) {
    return NextResponse.json({ error: "Parâmetro iid inválido." }, { status: 400 });
  }

  const page = parsePositiveInt(url.searchParams.get("page"), 1);
  const pageSize = Math.min(parsePositiveInt(url.searchParams.get("pageSize"), 50), 200);

  try {
    const [milestone, result] = await Promise.all([
      fetchMilestoneDetail(milestoneIid),
      fetchMilestoneIssues(milestoneIid, {
        search: url.searchParams.get("search") ?? undefined,
        status: url.searchParams.get("status") ?? undefined,
        estado: url.searchParams.get("estado") ?? undefined,
        metric: url.searchParams.get("metric") ?? undefined,
        order: url.searchParams.get("order") ?? undefined,
        page,
        pageSize,
      }),
    ]);

    if (!milestone) {
      return NextResponse.json(
        { error: `Milestone ${milestoneIid} não importada.` },
        { status: 404 },
      );
    }

    return NextResponse.json({
      milestone,
      filters: {
        search: url.searchParams.get("search") ?? "",
        status: url.searchParams.get("status") ?? "Todos",
        estado: url.searchParams.get("estado") ?? "Todos",
        metric: url.searchParams.get("metric") ?? "Todos",
        order: url.searchParams.get("order") ?? "gitlab_iid_asc",
        page,
        pageSize,
      },
      rows: result.rows,
      total: result.total,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao gerar relatório.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
