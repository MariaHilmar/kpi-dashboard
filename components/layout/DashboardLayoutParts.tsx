import { GlobalFilters } from "@/components/layout/GlobalFilters";
import { GovBrHeader } from "@/components/layout/GovBrHeader";
import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { isCurrentUserAdmin } from "@/lib/auth/profile";
import { fetchFilterOptions, fetchLastSync } from "@/lib/dashboard/fetchers";
import { getSessionUser } from "@/lib/supabase/session";

export function HeaderSkeleton() {
  return (
    <div className="sticky top-0 z-50 h-14 animate-pulse bg-govbr-blue/80" aria-hidden />
  );
}

export async function GovBrHeaderAsync() {
  const [lastSync, user] = await Promise.all([fetchLastSync(), getSessionUser()]);
  return <GovBrHeader lastSync={lastSync} userEmail={user?.email ?? null} />;
}

export async function SidebarAsync() {
  const isAdmin = await isCurrentUserAdmin();
  return <Sidebar isAdmin={isAdmin} />;
}

export async function MobileNavAsync() {
  const isAdmin = await isCurrentUserAdmin();
  return <MobileNav isAdmin={isAdmin} />;
}

export async function GlobalFiltersAsync() {
  const options = await fetchFilterOptions();
  return <GlobalFilters options={options} />;
}
