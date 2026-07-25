import { NextResponse } from "next/server";

/** Mantido por compatibilidade - redireciona para o Word completo do Executivo. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  url.pathname = "/api/executivo/export/word";
  return NextResponse.redirect(url, 307);
}
