"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { getNavGroups, isNavItemActive } from "@/lib/navigation";

type SidebarProps = {
  isAdmin?: boolean;
};

export function Sidebar({ isAdmin = false }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const groups = getNavGroups(isAdmin);

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)]">
      <nav className="flex-1 overflow-y-auto px-2 py-4" aria-label="Navegação principal">
        {groups.map((group) => (
          <div key={group.title} className="mb-4">
            <p className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
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
                      className={`group flex items-start gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                        active
                          ? "bg-govbr-blue/10 text-govbr-blue-dark font-semibold"
                          : "text-govbr-blue hover:bg-govbr-blue/10 hover:text-govbr-blue-dark"
                      }`}
                    >
                      <FontAwesomeIcon
                        icon={item.icon}
                        className={`mt-0.5 w-4 shrink-0 transition-colors ${
                          active
                            ? "text-govbr-blue-dark"
                            : "text-govbr-blue group-hover:text-govbr-blue-dark"
                        }`}
                        aria-hidden
                      />
                      <span className="flex-1">
                        <span className="block font-medium">{item.label}</span>
                        {item.description ? (
                          <span className="block text-xs text-slate-400 group-hover:text-slate-500">
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
