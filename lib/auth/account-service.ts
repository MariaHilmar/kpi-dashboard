import { createAdminSupabase } from "@/lib/supabase/admin";
import type { UserProfile } from "@/types/profile";

export async function updateOwnDisplayName(
  userId: string,
  fullName: string | null | undefined,
): Promise<{ profile: UserProfile } | { error: string }> {
  const admin = createAdminSupabase();
  if (!admin) {
    return { error: "Service role não configurada no servidor." };
  }

  const nextName = fullName === undefined ? undefined : fullName?.trim() || null;

  const { data: existing, error: fetchError } = await admin
    .from("profiles")
    .select("id, email, full_name, gitlab_user_id, autor_issues, role, active, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (fetchError || !existing) {
    return { error: "Perfil não encontrado." };
  }

  const current = existing as UserProfile;
  if (!current.active) {
    return { error: "Conta inativa." };
  }

  const resolvedName = nextName === undefined ? current.full_name : nextName;

  if (resolvedName !== current.full_name) {
    const { error: authError } = await admin.auth.admin.updateUserById(userId, {
      user_metadata: { full_name: resolvedName ?? "" },
    });
    if (authError) {
      return { error: authError.message };
    }
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .update({ full_name: resolvedName })
    .eq("id", userId)
    .select("id, email, full_name, gitlab_user_id, autor_issues, role, active, created_at, updated_at")
    .single();

  if (profileError || !profile) {
    return { error: profileError?.message ?? "Falha ao atualizar nome." };
  }

  return { profile: profile as UserProfile };
}
