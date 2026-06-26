"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { NAV_GROUPS, isNavItemActive } from "@/lib/navigation";

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)]">
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Navegação principal">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="mb-5">
            <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isNavItemActive(pathname, item.href);
                const href = query ? `${item.href}?${query}` : item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                        active
                          ? "bg-govbr-blue/10 text-govbr-blue-dark"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <span aria-hidden="true" className="text-base leading-5">
                        {item.icon}
                      </span>
                      <span className="flex-1">
                        <span className={`block ${active ? "font-semibold" : "font-medium"}`}>
                          {item.label}
                        </span>
                        {item.description ? (
                          <span className="block text-xs text-slate-400">
                            {item.description}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
