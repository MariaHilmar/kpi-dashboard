"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightFromBracket, faUser } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

type Props = {
  email: string;
};

export function AuthMenu({ email }: Props) {
  return (
    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
      <Link
        href="/conta"
        className="hidden items-center gap-1.5 rounded-button border border-white/30 px-2 py-1 text-xs font-medium text-white/95 transition hover:bg-white/10 sm:inline-flex"
        title="Minha conta"
      >
        <FontAwesomeIcon icon={faUser} className="w-3" aria-hidden />
        Conta
      </Link>
      <span className="hidden max-w-[10rem] truncate text-xs text-white/90 md:inline" title={email}>
        {email}
      </span>
      <form action="/auth/logout" method="post">
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-button border border-white/40 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-white/10"
        >
          <FontAwesomeIcon icon={faRightFromBracket} className="w-3" aria-hidden />
          Sair
        </button>
      </form>
    </div>
  );
}
