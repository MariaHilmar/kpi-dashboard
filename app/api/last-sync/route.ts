import { NextResponse } from "next/server";

import { fetchLastSync } from "@/lib/dashboard/fetchers";

/** GET /api/last-sync — timestamp da última carga GitLab → Supabase (ao vivo). */
export async function GET() {
  const lastSync = await fetchLastSync();
  return NextResponse.json(
    { lastSync },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
