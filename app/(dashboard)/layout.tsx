import { ReactNode, Suspense } from "react";

import { GlobalFilters } from "@/components/layout/GlobalFilters";
import { GovBrFooter } from "@/components/layout/GovBrFooter";
import { GovBrHeader } from "@/components/layout/GovBrHeader";
import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { fetchFilterOptions, fetchLastSync } from "@/lib/dashboard/fetchers";

type LayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: LayoutProps) {
  const [options, lastSync] = await Promise.all([fetchFilterOptions(), fetchLastSync()]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <GovBrHeader lastSync={lastSync} />

      <div className="flex min-w-0 flex-1">
        <Suspense fallback={null}>
          <Sidebar />
        </Suspense>

        <div className="flex min-w-0 flex-1 flex-col">
          <Suspense fallback={null}>
            <MobileNav />
          </Suspense>

          <main id="conteudo-principal" className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-7xl flex-col gap-6">
              <Suspense fallback={<div className="h-24 animate-pulse rounded-xl bg-white" />}>
                <GlobalFilters options={options} />
              </Suspense>
              {children}
            </div>
          </main>

          <GovBrFooter />
        </div>
      </div>
    </div>
  );
}
