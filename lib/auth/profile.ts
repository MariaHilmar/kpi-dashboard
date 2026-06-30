import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/supabase/session";
import type { UserProfile, UserRole } from "@/types/profile";

export type AdminContext = {
  userId: string;
  email: string;
  profile: UserProfile;
};

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, gitlab_user_id, autor_issues, role, active, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as UserProfile;
}

export async function getCurrentProfile(): Promise<UserProfile | null> {
  const user = await getSessionUser();
  if (!user) return null;
  return getProfile(user.id);
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const profile = await getCurrentProfile();
  return Boolean(profile?.active && profile.role === "admin");
}

export async function requireAdmin(): Promise<
  { ok: true; context: AdminContext } | { ok: false; status: number; message: string }
> {
  const user = await getSessionUser();
  if (!user?.email) {
    return { ok: false, status: 401, message: "Não autenticado." };
  }

  const profile = await getProfile(user.id);
  if (!profile?.active) {
    return { ok: false, status: 403, message: "Conta inativa." };
  }

  if (profile.role !== "admin") {
    return { ok: false, status: 403, message: "Acesso restrito a administradores." };
  }

  return {
    ok: true,
    context: { userId: user.id, email: user.email, profile },
  };
}

export async function listProfiles(): Promise<UserProfile[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, gitlab_user_id, autor_issues, role, active, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listProfiles", error.message);
    return [];
  }

  return (data ?? []) as UserProfile[];
}

export async function countActiveAdmins(excludeId?: string): Promise<number> {
  const admin = createAdminSupabase();
  if (!admin) return 0;

  let query = admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin")
    .eq("active", true);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { count, error } = await query;
  if (error) {
    console.error("countActiveAdmins", error.message);
    return 0;
  }

  return count ?? 0;
}

export function isValidRole(value: unknown): value is UserRole {
  return value === "admin" || value === "user";
}

/**
 * Valor a usar no filtro `issues.autor` para este perfil: `autor_issues`
 * (definido pelo admin) tem prioridade; na ausência, cai para `full_name`.
 * Preferir `resolveAnalistaIssueFilter` quando `gitlab_user_id` estiver preenchido.
 */
export function resolveAutorFiltro(profile: UserProfile | null): string | null {
  const autor = profile?.autor_issues?.trim();
  if (autor) return autor;
  const nome = profile?.full_name?.trim();
  return nome || null;
}

/** Filtro preferencial de issues do analista: GitLab ID ou nome legado. */
export function resolveAnalistaIssueFilter(profile: UserProfile | null): {
  gitlabUserId: number | null;
  autor: string | null;
} {
  if (profile?.gitlab_user_id) {
    return { gitlabUserId: profile.gitlab_user_id, autor: null };
  }
  return { gitlabUserId: null, autor: resolveAutorFiltro(profile) };
}

/** Localiza perfil cujo filtro de autor coincide (gestores/admin veem todos via RLS). */
export async function findProfileByAutor(autor: string): Promise<UserProfile | null> {
  const needle = autor.trim().toLowerCase();
  if (!needle) return null;

  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, gitlab_user_id, autor_issues, role, active, created_at, updated_at");

  if (error || !data) return null;

  return (
    (data as UserProfile[]).find(
      (profile) => resolveAutorFiltro(profile)?.toLowerCase() === needle,
    ) ?? null
  );
}

export function isSameAutor(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a?.trim() || !b?.trim()) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
