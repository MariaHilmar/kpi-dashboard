import { redirect } from "next/navigation";

/** Páginas ocultas do menu; acesso direto redireciona para a home. */
export const HIDDEN_DASHBOARD_PAGE_HREFS = new Set([
  "/fluxo",
  "/milestone",
  "/milestone/roadmap",
  "/equipes",
  "/sprint",
]);

export function isHiddenDashboardPageHref(href: string): boolean {
  return HIDDEN_DASHBOARD_PAGE_HREFS.has(href);
}

/** Redireciona para `/` quando a rota estiver oculta. */
export function assertDashboardPageVisible(href: string): void {
  if (isHiddenDashboardPageHref(href)) {
    redirect("/");
  }
}
