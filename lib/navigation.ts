/**
 * Fonte única de verdade da navegação do dashboard.
 *
 * Tanto a `Sidebar` (desktop) quanto o `MobileNav` derivam destes dados,
 * evitando listas de rotas duplicadas e divergentes.
 */

export type NavItem = {
  href: string;
  label: string;
  /** Rótulo curto opcional para a navegação mobile. */
  shortLabel?: string;
  icon: string;
  description?: string;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Visão geral",
    items: [
      { href: "/", label: "Executivo", icon: "📊", description: "KPIs e visão consolidada" },
      { href: "/alertas", label: "Alertas", icon: "🚨", description: "Sem épico/parceria + idade" },
    ],
  },
  {
    title: "Análise",
    items: [
      { href: "/temporal", label: "Análise Temporal", shortLabel: "Temporal", icon: "📈" },
      { href: "/detalhamento", label: "Detalhamento", shortLabel: "Detalhe", icon: "🔍" },
      { href: "/qualidade", label: "Qualidade", icon: "💎" },
    ],
  },
  {
    title: "Operação",
    items: [
      { href: "/sprint", label: "Sprint Atual", shortLabel: "Sprint", icon: "🏃" },
      { href: "/equipes", label: "Equipes & Devs", shortLabel: "Equipes", icon: "👥" },
    ],
  },
  {
    title: "Dados",
    items: [
      { href: "/issues", label: "Issues", icon: "📋", description: "Busca livre + tabela" },
    ],
  },
];

/** Lista achatada de itens, na ordem dos grupos (usada no mobile). */
export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

/** Indica se uma rota está ativa para um dado pathname. */
export function isNavItemActive(pathname: string | null, href: string): boolean {
  if (href === "/") return pathname === "/";
  return Boolean(pathname?.startsWith(href));
}
