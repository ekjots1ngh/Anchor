import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "quiet" | "danger";

const base =
  "inline-flex min-h-[2.75rem] items-center justify-center rounded-pill px-6 py-3 text-base font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:opacity-60";

const variants: Record<Variant, string> = {
  // The one grounded accent: solid teal for the single primary action.
  primary: "bg-accent text-accent-foreground hover:bg-accent-strong",
  // Quiet outline for secondary actions.
  secondary: "border border-accent/40 text-accent-text hover:bg-accent-soft",
  // Ghost for tertiary / dismissive actions.
  quiet: "text-ink-muted hover:bg-accent-soft",
  // Clay outline for gentle destructive actions (never an alarm red).
  danger: "border border-crisis-border text-crisis-text hover:bg-crisis-soft",
};

/** A calm, rounded action. Renders as a link when `href` is provided. */
export function Button({
  children,
  href,
  variant = "primary",
  className = "",
  type = "button",
  onClick,
  disabled,
}: {
  children: ReactNode;
  href?: string;
  variant?: Variant;
  className?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
}) {
  const classes = `${base} ${variants[variant]} ${className}`;
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
