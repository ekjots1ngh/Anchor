import type { ReactNode } from "react";

/** A soft, rounded surface with generous padding. The app's basic unit. */
export function Card({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={`rounded-card bg-surface border border-line shadow-card p-6 sm:p-8 ${className}`}
    >
      {children}
    </div>
  );
}
