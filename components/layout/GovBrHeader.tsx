import Image from "next/image";

import { formatDateTime } from "@/lib/format";
import govbrLogo from "@/public/govbr-logo.png";

type Props = {
  lastSync?: string | null;
};

export function GovBrHeader({ lastSync }: Props) {
  return (
    <header className="sticky top-0 z-50 bg-govbr-blue shadow-md">
      <div className="flex items-center gap-3 pr-4 sm:pr-6 lg:pr-8">
        {/* Logo gov.br em chip branco à esquerda */}
        <a
          href="https://www.gov.br"
          target="_blank"
          rel="noreferrer noopener"
          aria-label="Portal gov.br (abre em nova aba)"
          className="flex h-14 items-center bg-white px-4"
        >
          <Image src={govbrLogo} alt="gov.br" priority className="h-6 w-auto" sizes="80px" />
        </a>

        {/* Identidade MGI */}
        <span
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-white font-[var(--font-display)] text-xs font-bold text-govbr-blue"
        >
          MGI
        </span>

        <div className="min-w-0">
          <p className="truncate font-[var(--font-display)] text-sm font-bold leading-tight text-white sm:text-base">
            Dashboard Kpis Projetos
          </p>
        </div>

        {lastSync ? (
          <p className="ml-auto hidden shrink-0 text-xs text-white/80 md:block">
            Dados atualizado em {formatDateTime(lastSync)}
          </p>
        ) : null}
      </div>
    </header>
  );
}
