import { ReactNode, Suspense } from "react";

import {
  GlobalFiltersAsync,
  GovBrHeaderAsync,
  HeaderSkeleton,
  MobileNavAsync,
  SidebarAsync,
} from "@/components/layout/DashboardLayoutParts";
import { GovBrFooter } from "@/components/layout/GovBrFooter";

type LayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Suspense fallback={<HeaderSkeleton />}>
        <GovBrHeaderAsync />
      </Suspense>

      <div className="flex min-w-0 flex-1">
        <Suspense fallback={null}>
          <SidebarAsync />
        </Suspense>

        <div className="flex min-w-0 flex-1 flex-col">
          <Suspense fallback={null}>
            <MobileNavAsync />
          </Suspense>

          <main id="conteudo-principal" className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-7xl flex-col gap-6">
              <Suspense fallback={<div className="h-24 animate-pulse rounded-xl bg-white" />}>
                <GlobalFiltersAsync />
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
