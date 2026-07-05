"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";

type InfoTooltipProps = {
  text: string;
};

export function InfoTooltip({ text }: Readonly<InfoTooltipProps>) {
  return (
    <span
      className="group/info relative inline-flex shrink-0"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onKeyDown={(event) => {
        event.stopPropagation();
      }}
    >
      <span
        tabIndex={0}
        aria-label={text.replace(/\n+/g, " ")}
        className="cursor-help rounded-sm text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:text-slate-600 focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <FontAwesomeIcon icon={faCircleInfo} className="h-3 w-3" aria-hidden />
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute right-0 top-full z-50 mt-1.5 hidden w-60 whitespace-pre-line rounded-md bg-slate-900 px-3 py-2 text-left text-xs font-normal normal-case leading-relaxed tracking-normal text-white shadow-lg group-hover/info:block group-focus-within/info:block sm:w-64"
      >
        {text}
      </span>
    </span>
  );
}
