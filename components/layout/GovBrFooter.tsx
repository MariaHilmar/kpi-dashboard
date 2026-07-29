import { formatAppVersionLabel } from "@/lib/app-version";

export function GovBrFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-govbr-blue-darker text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <p className="text-xs text-white/60">
          Painel interno de gestão · Dados coletados do GitLab · {formatAppVersionLabel()}
        </p>
      </div>
    </footer>
  );
}
