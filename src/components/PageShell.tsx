import Link from "next/link";
import type { ReactNode } from "react";

const NAV = [
  { href: "/checkin", label: "Check-in" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/plan", label: "My plan" },
  { href: "/data", label: "Your data" },
];

/**
 * Page frame: centred, generous whitespace, soft neutral canvas. Holds the
 * lightweight nav and a persistent, quiet reminder that Anchor supports
 * care and never replaces it.
 */
export function PageShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-line/70">
        <div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-4 sm:px-6 sm:py-5">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Anchor
          </Link>
          <nav aria-label="Primary" className="flex flex-wrap gap-1 text-sm">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-pill px-3 py-2 text-ink-muted hover:bg-steady-50 hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-content px-5 py-12 sm:px-6 sm:py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h1>
          {intro ? (
            <p className="mt-4 max-w-prose text-lg leading-relaxed text-ink-muted">
              {intro}
            </p>
          ) : null}
        </div>

        <div className="space-y-8">{children}</div>
      </main>

      <footer className="mx-auto max-w-content px-6 pb-16">
        <p className="text-sm leading-relaxed text-ink-faint">
          Anchor is not a diagnostic tool and makes no medical claims. It
          reflects your own pre-agreed early-warning signs back to you and
          helps you reach real human support. It supports clinical care — it
          never replaces it. If you are in crisis, contact your care team or
          local emergency services.
        </p>
      </footer>
    </div>
  );
}
