import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/profile";
import { updateManagedUser } from "@/lib/auth/users-service";
import type { UpdateUserInput } from "@/types/profile";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const { id } = await params;

  let body: UpdateUserInput;
  try {
    body = (await request.json()) as UpdateUserInput;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const result = await updateManagedUser(id, body, auth.context.userId);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ user: result.profile });
}
