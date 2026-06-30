import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

import govbrLogo from "@/public/govbr-logo.png";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="bg-govbr-blue px-4 py-4 shadow-md">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <Image src={govbrLogo} alt="gov.br" priority className="h-6 w-auto bg-white p-1" sizes="80px" />
          <Link href="/login" className="font-[var(--font-display)] text-sm font-bold text-white">
            MGI · Dashboard
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="font-[var(--font-display)] text-xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
          <div className="mt-6">{children}</div>
          {footer ? <div className="mt-6">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
}
