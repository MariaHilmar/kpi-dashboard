/**
 * Fonte única de verdade da navegação do dashboard.
 *
 * Tanto a `Sidebar` (desktop) quanto o `MobileNav` derivam destes dados,
 * evitando listas de rotas duplicadas e divergentes.
 */

import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faDiagramProject,
  faHandshake,
  faAward,
  faChartPie,
  faClipboardList,
  faFileArrowUp,
  faFileLines,
  faFlagCheckered,
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
  /** Exibe o sufixo "(BETA)" em vermelho após o rótulo. */
  beta?: boolean;
  /** Visível apenas quando a app roda em http://localhost/ */
  localhostOnly?: boolean;
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
    ],
  },
  {
    title: "Análise",
    items: [
      {
        href: "/fluxo",
        label: "Fluxo Kanban",
        shortLabel: "Fluxo",
        icon: faDiagramProject,
        description: "Métricas de fluxo Kanban",
      },
      {
        href: "/milestone",
        label: "Relatório Milestone",
        shortLabel: "Milestone",
        icon: faFlagCheckered,
        description: "Throughput intra-sprint por IID GitLab",
        beta: true,
      },
    ],
  },
  {
    title: "Operação",
    items: [
      { href: "/sprint", label: "Sprint Atual", shortLabel: "Sprint", icon: faRocket },
      {
        href: "/milestone/roadmap",
        label: "Roadmap PMO",
        shortLabel: "Roadmap",
        icon: faChartPie,
        description: "Entregas por módulo/épico sprint a sprint",
        localhostOnly: true,
      },
      {
        href: "/parcerias",
        label: "Parcerias",
        icon: faHandshake,
        description: "Relatório mensal por parceiro",
      },
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
      {
        href: "/importar-dados",
        label: "Importar Dados",
        shortLabel: "Importar",
        icon: faFileArrowUp,
        description: "Planning Poker — Excel/CSV",
      },
      { href: "/qualidade", label: "Qualidade Dados", icon: faAward },
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

/** Indica se a app está sendo executada em http://localhost/ (qualquer porta). */
export function isLocalhostOrigin(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export function shouldShowNavItem(item: NavItem, isLocalhost: boolean): boolean {
  if (item.localhostOnly && !isLocalhost) return false;
  return true;
}

export function filterNavGroups(groups: NavGroup[], isLocalhost: boolean): NavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => shouldShowNavItem(item, isLocalhost)),
    }))
    .filter((group) => group.items.length > 0);
}

export function getNavGroups(isAdmin: boolean, isLocalhost = false): NavGroup[] {
  const administrationItems = isAdmin
    ? [...ADMINISTRATION_NAV_GROUP.items, ...ADMIN_NAV_ITEMS]
    : ADMINISTRATION_NAV_GROUP.items;

  return filterNavGroups(
    [
      ...NAV_GROUPS,
      {
        ...ADMINISTRATION_NAV_GROUP,
        items: administrationItems,
      },
    ],
    isLocalhost,
  );
}

/** Lista achatada de itens, na ordem dos grupos (usada no mobile). */
export function getNavItems(isAdmin: boolean, isLocalhost = false): NavItem[] {
  return getNavGroups(isAdmin, isLocalhost).flatMap((group) => group.items);
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
