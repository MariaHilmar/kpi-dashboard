"use client";

import { type ReactNode } from "react";

import { isSupabaseConfigured } from "@/lib/supabase/env";

export function SupabaseGuard({ children }: { children: ReactNode }) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Configure <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
        <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> em{" "}
        <code className="font-mono">.env.local</code>.
      </div>
    );
  }

  return <>{children}</>;
}
