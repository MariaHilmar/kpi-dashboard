import type { NavItem } from "@/lib/navigation";

type NavItemLabelProps = {
  item: NavItem;
  /** Usa shortLabel quando definido (navegação mobile). */
  preferShort?: boolean;
};

export function NavItemLabel({ item, preferShort = false }: Readonly<NavItemLabelProps>) {
  const text = preferShort ? (item.shortLabel ?? item.label) : item.label;

  if (!item.beta) return <>{text}</>;

  return (
    <>
      {text}
      <span className="font-semibold text-red-600"> (BETA)</span>
    </>
  );
}
