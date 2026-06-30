import { createClient } from "@supabase/supabase-js";

import { getSupabaseUrl } from "@/lib/supabase/env";

/** Cliente Admin (service role) — apenas server-side, nunca no browser. */
export function createAdminSupabase() {
  const url = getSupabaseUrl() || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function isAdminApiConfigured() {
  return Boolean(
    (getSupabaseUrl() || process.env.SUPABASE_URL) && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}
