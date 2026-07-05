"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { getNavItems, isNavItemActive, buildNavHref } from "@/lib/navigation";
import { useIsLocalhost } from "@/hooks/useIsLocalhost";
import { NavItemLabel } from "@/components/layout/NavItemLabel";

type MobileNavProps = {
  isAdmin?: boolean;
};

export function MobileNav({ isAdmin = false }: MobileNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const isLocalhost = useIsLocalhost();
  const items = getNavItems(isAdmin, isLocalhost);

  return (
    <nav
      aria-label="Navegação principal"
      className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-2 py-2 lg:hidden"
    >
      {items.map((item) => {
        const active = isNavItemActive(pathname, item.href);
        const href = buildNavHref(item.href, query);
        return (
          <Link
            key={item.href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-govbr-blue/10 text-govbr-blue-dark"
                : "text-govbr-blue hover:bg-govbr-blue/10 hover:text-govbr-blue-dark"
            }`}
          >
            <FontAwesomeIcon
              icon={item.icon}
              className={`w-3.5 transition-colors ${
                active ? "text-govbr-blue-dark" : "text-govbr-blue"
              }`}
              aria-hidden
            />
            <NavItemLabel item={item} preferShort />
          </Link>
        );
      })}
    </nav>
  );
}
