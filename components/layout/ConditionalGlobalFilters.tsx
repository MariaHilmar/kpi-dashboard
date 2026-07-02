"use client";

import { usePathname } from "next/navigation";

import { GlobalFilters } from "@/components/layout/GlobalFilters";
import type { FilterOptions } from "@/types/database";

const ROUTES_WITHOUT_GLOBAL_FILTERS = ["/parcerias"];

type Props = {
  options: FilterOptions;
};

export function ConditionalGlobalFilters({ options }: Props) {
  const pathname = usePathname();
  const hide = ROUTES_WITHOUT_GLOBAL_FILTERS.some((route) => pathname?.startsWith(route));

  if (hide) return null;
  return <GlobalFilters options={options} />;
}
