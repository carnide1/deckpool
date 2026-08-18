import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
};

const variantClass: Record<Variant, string> = {
  primary:
    "bg-[var(--accent-pirate-red)] text-white hover:opacity-90 disabled:opacity-50",
  secondary:
    "border border-[var(--bg-inset)] bg-[var(--bg-panel)] text-[var(--ink-primary)] hover:bg-[var(--bg-inset)] disabled:opacity-50",
  ghost:
    "bg-transparent text-[var(--ink-muted)] hover:bg-[var(--bg-inset)] hover:text-[var(--ink-primary)] disabled:opacity-50",
};

const sizeClass: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-semibold transition-opacity disabled:cursor-not-allowed",
        variantClass[variant],
        sizeClass[size],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
