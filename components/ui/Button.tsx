import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type ButtonSize = "sm" | "md";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-govbr-blue text-white hover:bg-govbr-blue-dark",
  secondary: "border border-govbr-blue text-govbr-blue hover:bg-blue-50",
  ghost: "text-slate-500 hover:text-slate-700",
  outline: "border border-slate-300 text-slate-700 hover:bg-slate-50",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs font-medium",
  md: "px-4 py-2 text-sm font-medium",
};

const baseClass =
  "inline-flex items-center justify-center gap-2 rounded-button font-medium transition disabled:cursor-not-allowed disabled:opacity-40";

type SharedProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

type ButtonProps = SharedProps & ButtonHTMLAttributes<HTMLButtonElement>;

type LinkButtonProps = SharedProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${baseClass} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: LinkButtonProps) {
  return (
    <a
      className={`${baseClass} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
}
