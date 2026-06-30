/** Variáveis públicas do Supabase (browser + server). */
export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
}

export function getSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

/** Quando false, o middleware não exige login (útil em dev local). Padrão: exige login. */
export function isAuthRequired() {
  return process.env.NEXT_PUBLIC_AUTH_REQUIRED !== "false";
}

/** Permite página /cadastro. Padrão: false (usuários criados pelo admin). */
export function isSignupAllowed() {
  return process.env.NEXT_PUBLIC_ALLOW_SIGNUP === "true";
}
