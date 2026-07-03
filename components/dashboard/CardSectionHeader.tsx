"use client";

import type { ReactNode } from "react";

import { InfoTooltip } from "@/components/ui/InfoTooltip";

type CardSectionHeaderProps = {
  title: string;
  subtitle?: ReactNode;
  tooltip?: string;
  as?: "h2" | "h3";
  titleClassName?: string;
  className?: string;
};

export function CardSectionHeader({
  title,
  subtitle,
  tooltip,
  as: Tag = "h2",
  titleClassName = "text-lg font-semibold text-slate-900",
  className = "mb-4",
}: Readonly<CardSectionHeaderProps>) {
  return (
    <div className={className}>
      <div className="flex items-start justify-between gap-2">
        <Tag className={titleClassName}>{title}</Tag>
        {tooltip ? <InfoTooltip text={tooltip} /> : null}
      </div>
      {subtitle ? (
        typeof subtitle === "string" ? (
          <p className="text-sm text-slate-500">{subtitle}</p>
        ) : (
          subtitle
        )
      ) : null}
    </div>
  );
}
