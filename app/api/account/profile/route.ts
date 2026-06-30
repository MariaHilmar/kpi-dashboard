import { NextResponse } from "next/server";

import { updateOwnDisplayName } from "@/lib/auth/account-service";
import { getCurrentProfile } from "@/lib/auth/profile";
import { getSessionUser } from "@/lib/supabase/session";

type UpdateOwnProfileInput = {
  full_name?: string | null;
};

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const profile = await getCurrentProfile();
  if (!profile?.active) {
    return NextResponse.json({ error: "Conta inativa." }, { status: 403 });
  }

  let body: UpdateOwnProfileInput;
  try {
    body = (await request.json()) as UpdateOwnProfileInput;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (body.full_name === undefined) {
    return NextResponse.json({ error: "Informe o nome de exibição." }, { status: 400 });
  }

  const result = await updateOwnDisplayName(user.id, body.full_name);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ profile: result.profile });
}
