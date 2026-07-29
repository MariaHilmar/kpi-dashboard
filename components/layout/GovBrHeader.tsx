import { AuthMenu } from "@/components/auth/AuthMenu";
import { formatDateTime } from "@/lib/format";

type Props = {
  lastSync?: string | null;
  userEmail?: string | null;
};

export function GovBrHeader({ lastSync, userEmail }: Props) {
  return (
    <header className="sticky top-0 z-50 bg-govbr-blue shadow-md">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <p className="truncate font-[var(--font-display)] text-base font-bold leading-tight text-white sm:text-lg">
            Dashboard Kpis Projetos
          </p>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-4">
          {lastSync ? (
            <p className="hidden text-sm text-white/80 md:block">
              Dados atualizado em {formatDateTime(lastSync)}
            </p>
          ) : null}
          {userEmail ? <AuthMenu email={userEmail} /> : null}
        </div>
      </div>
    </header>
  );
}
