import { createAdminSupabase } from "@/lib/supabase/admin";
import { countActiveAdmins, isValidRole } from "@/lib/auth/profile";
import type { CreateUserInput, UpdateUserInput, UserProfile } from "@/types/profile";

const BAN_WHEN_INACTIVE = "876000h";
const PROFILE_COLUMNS =
  "id, email, full_name, gitlab_user_id, autor_issues, role, active, created_at, updated_at";

async function ensureGitlabUser(
  admin: NonNullable<ReturnType<typeof createAdminSupabase>>,
  gitlabUserId: number | null | undefined,
  fullName?: string | null,
): Promise<number | null> {
  if (gitlabUserId == null || gitlabUserId <= 0) {
    return null;
  }

  const { error } = await admin.from("gitlab_users").upsert(
    {
      id: gitlabUserId,
      username: `user-${gitlabUserId}`,
      name: fullName?.trim() || null,
    },
    { onConflict: "id" },
  );

  if (error) {
    throw new Error(error.message);
  }

  return gitlabUserId;
}

export async function createManagedUser(
  input: CreateUserInput,
): Promise<{ profile: UserProfile } | { error: string }> {
  const admin = createAdminSupabase();
  if (!admin) {
    return { error: "Service role não configurada no servidor." };
  }

  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const role = isValidRole(input.role) ? input.role : "user";
  const active = input.active ?? true;
  const fullName = input.full_name?.trim() || null;
  const autorIssues = input.autor_issues?.trim() || null;
  let gitlabUserId: number | null = null;

  if (input.gitlab_user_id != null) {
    try {
      gitlabUserId = await ensureGitlabUser(admin, input.gitlab_user_id, fullName);
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : "Não foi possível vincular usuário GitLab.",
      };
    }
  }

  if (!email || !password || password.length < 6) {
    return { error: "E-mail e senha (mín. 6 caracteres) são obrigatórios." };
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: fullName ? { full_name: fullName } : undefined,
  });

  if (createError || !created.user) {
    return { error: createError?.message ?? "Não foi possível criar o usuário." };
  }

  const userId = created.user.id;

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .upsert(
      {
        id: userId,
        email,
        full_name: fullName,
        gitlab_user_id: gitlabUserId,
        autor_issues: autorIssues,
        role,
        active,
      },
      { onConflict: "id" },
    )
    .select(PROFILE_COLUMNS)
    .single();

  if (profileError || !profile) {
    await admin.auth.admin.deleteUser(userId);
    return { error: profileError?.message ?? "Falha ao salvar perfil." };
  }

  if (!active) {
    await admin.auth.admin.updateUserById(userId, { ban_duration: BAN_WHEN_INACTIVE });
  }

  return { profile: profile as UserProfile };
}

export async function updateManagedUser(
  userId: string,
  input: UpdateUserInput,
  actorId: string,
): Promise<{ profile: UserProfile } | { error: string }> {
  const admin = createAdminSupabase();
  if (!admin) {
    return { error: "Service role não configurada no servidor." };
  }

  const { data: existing, error: fetchError } = await admin
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (fetchError || !existing) {
    return { error: "Usuário não encontrado." };
  }

  const current = existing as UserProfile;
  const nextRole = isValidRole(input.role) ? input.role : current.role;
  const nextActive = typeof input.active === "boolean" ? input.active : current.active;
  const nextName =
    input.full_name === undefined ? current.full_name : input.full_name?.trim() || null;
  const nextAutorIssues =
    input.autor_issues === undefined ? current.autor_issues : input.autor_issues?.trim() || null;
  let nextGitlabUserId =
    input.gitlab_user_id === undefined ? current.gitlab_user_id : input.gitlab_user_id;

  if (input.gitlab_user_id !== undefined) {
    try {
      nextGitlabUserId = await ensureGitlabUser(admin, input.gitlab_user_id, nextName);
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : "Não foi possível vincular usuário GitLab.",
      };
    }
  }

  if (userId === actorId && nextRole !== "admin") {
    return { error: "Você não pode remover seu próprio perfil de administrador." };
  }

  if (userId === actorId && !nextActive) {
    return { error: "Você não pode inativar sua própria conta." };
  }

  if (current.role === "admin" && nextRole !== "admin" && current.active) {
    const others = await countActiveAdmins(userId);
    if (others === 0) {
      return { error: "Deve existir pelo menos um administrador ativo." };
    }
  }

  if (current.role === "admin" && current.active && !nextActive) {
    const others = await countActiveAdmins(userId);
    if (others === 0) {
      return { error: "Deve existir pelo menos um administrador ativo." };
    }
  }

  const authUpdate: {
    ban_duration?: string;
    password?: string;
    user_metadata?: { full_name: string };
  } = {};
  if (!nextActive) {
    authUpdate.ban_duration = BAN_WHEN_INACTIVE;
  } else {
    authUpdate.ban_duration = "none";
  }

  if (input.password) {
    if (input.password.length < 6) {
      return { error: "A nova senha deve ter pelo menos 6 caracteres." };
    }
    authUpdate.password = input.password;
  }

  if (nextName !== current.full_name) {
    authUpdate.user_metadata = { full_name: nextName ?? "" };
  }

  const { error: authError } = await admin.auth.admin.updateUserById(userId, authUpdate);
  if (authError) {
    return { error: authError.message };
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .update({
      full_name: nextName,
      gitlab_user_id: nextGitlabUserId,
      autor_issues: nextAutorIssues,
      role: nextRole,
      active: nextActive,
    })
    .eq("id", userId)
    .select(PROFILE_COLUMNS)
    .single();

  if (profileError || !profile) {
    return { error: profileError?.message ?? "Falha ao atualizar perfil." };
  }

  return { profile: profile as UserProfile };
}
