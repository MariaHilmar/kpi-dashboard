import Image from "next/image";

import { formatAppVersionLabel } from "@/lib/app-version";
import govbrLogo from "@/public/govbr-logo.png";

export function GovBrFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-govbr-blue-darker text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center rounded bg-white px-2 py-1">
            <Image src={govbrLogo} alt="gov.br" className="h-5 w-auto" sizes="70px" />
          </span>
          <p className="text-xs text-white/70">
            Ministério da Gestão e da Inovação em Serviços Públicos
          </p>
        </div>
        <p className="text-xs text-white/60">
          Painel interno de gestão · Dados coletados do GitLab · {formatAppVersionLabel()}
        </p>
      </div>
    </footer>
  );
}
