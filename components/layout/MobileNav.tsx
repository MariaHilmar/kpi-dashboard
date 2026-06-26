"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { NAV_ITEMS, isNavItemActive } from "@/lib/navigation";

export function MobileNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  return (
    <nav
      aria-label="Navegação principal"
      className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 lg:hidden"
    >
      {NAV_ITEMS.map((item) => {
        const active = isNavItemActive(pathname, item.href);
        const href = query ? `${item.href}?${query}` : item.href;
        return (
          <Link
            key={item.href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${
              active
                ? "bg-govbr-blue/10 text-govbr-blue-dark"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span aria-hidden="true">{item.icon}</span>
            {item.shortLabel ?? item.label}
          </Link>
        );
      })}
    </nav>
  );
}
