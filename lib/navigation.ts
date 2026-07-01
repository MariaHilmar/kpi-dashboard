/**
 * Fonte única de verdade da navegação do dashboard.
 *
 * Tanto a `Sidebar` (desktop) quanto o `MobileNav` derivam destes dados,
 * evitando listas de rotas duplicadas e divergentes.
 */

import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faAward,
  faBell,
  faChartLine,
  faChartPie,
  faClipboardList,
  faFileLines,
  faMagnifyingGlass,
  faRocket,
  faUser,
  faUsers,
  faUserShield,
} from "@fortawesome/free-solid-svg-icons";

export type NavItem = {
  href: string;
  label: string;
  /** Rótulo curto opcional para a navegação mobile. */
  shortLabel?: string;
  icon: IconDefinition;
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
      {
        href: "/",
        label: "Executivo",
        icon: faChartPie,
        description: "KPIs e visão consolidada",
      },
      {
        href: "/alertas",
        label: "Alertas",
        icon: faBell,
        description: "Sem épico/parceria + idade",
      },
    ],
  },
  {
    title: "Análise",
    items: [
      {
        href: "/temporal",
        label: "Análise Temporal",
        shortLabel: "Temporal",
        icon: faChartLine,
      },
      {
        href: "/detalhamento",
        label: "Detalhamento",
        shortLabel: "Detalhe",
        icon: faMagnifyingGlass,
      },
      { href: "/qualidade", label: "Qualidade", icon: faAward },
    ],
  },
  {
    title: "Operação",
    items: [
      { href: "/sprint", label: "Sprint Atual", shortLabel: "Sprint", icon: faRocket },
      { href: "/equipes", label: "Equipes & Devs", shortLabel: "Equipes", icon: faUsers },
      {
        href: "/analistas",
        label: "Analistas",
        icon: faFileLines,
        description: "Relatório mensal de atividades",
      },
    ],
  },
  {
    title: "Dados",
    items: [
      {
        href: "/issues",
        label: "Issues",
        icon: faClipboardList,
        description: "Busca livre + tabela",
      },
    ],
  },
];

export const ADMINISTRATION_NAV_GROUP: NavGroup = {
  title: "Administração",
  items: [
    {
      href: "/conta",
      label: "Minha conta",
      icon: faUser,
      description: "Alterar senha",
    },
  ],
};

export const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    href: "/admin/usuarios",
    label: "Usuários",
    shortLabel: "Usuários",
    icon: faUserShield,
    description: "Gerenciar acessos (admin)",
  },
];

export function getNavGroups(isAdmin: boolean): NavGroup[] {
  const administrationItems = isAdmin
    ? [...ADMINISTRATION_NAV_GROUP.items, ...ADMIN_NAV_ITEMS]
    : ADMINISTRATION_NAV_GROUP.items;

  return [
    ...NAV_GROUPS,
    {
      ...ADMINISTRATION_NAV_GROUP,
      items: administrationItems,
    },
  ];
}

/** Lista achatada de itens, na ordem dos grupos (usada no mobile). */
export function getNavItems(isAdmin: boolean): NavItem[] {
  return getNavGroups(isAdmin).flatMap((group) => group.items);
}

/** Indica se uma rota está ativa para um dado pathname. */
export function isNavItemActive(pathname: string | null, href: string): boolean {
  if (href === "/") return pathname === "/";
  return Boolean(pathname?.startsWith(href));
}

/**
 * Monta href de navegação preservando filtros globais da URL atual.
 * Em `/sprint`, remove `sprint` para que a página aplique o default (última sprint).
 */
export function buildNavHref(href: string, query: string): string {
  if (!query) return href;

  const params = new URLSearchParams(query);
  if (href === "/sprint") params.delete("sprint");

  const nextQuery = params.toString();
  return nextQuery ? `${href}?${nextQuery}` : href;
}
