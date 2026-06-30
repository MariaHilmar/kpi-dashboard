import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase/env";

export function createBrowserSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase não configurado");
  }

  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
}
