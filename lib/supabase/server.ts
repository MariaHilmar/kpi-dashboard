import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase/env";

export { isSupabaseConfigured } from "@/lib/supabase/env";

/** Cliente anon sem cookies — seguro para `unstable_cache` e RPCs SECURITY DEFINER. */
export function createStaticSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/** Cliente anon com `cache: no-store` — consultas que devem refletir o banco ao vivo. */
export function createLiveSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: (url, init) => fetch(url, { ...init, cache: "no-store" }),
    },
  });
}

export async function createServerSupabase() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // setAll em Server Component — middleware renova a sessão.
        }
      },
    },
  });
}
