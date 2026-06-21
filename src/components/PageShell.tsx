import Link from "next/link";
import type { ReactNode } from "react";
import { ReachSupport, ReachSupportLink } from "@/components/ReachSupport";
import { PrimaryNav } from "@/components/PrimaryNav";

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
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <header className="border-b border-line/70">
        <div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-4 sm:px-6 sm:py-5">
          <Link
            href="/"
            className="inline-flex min-h-[2.75rem] items-center rounded-pill px-2 text-lg font-semibold tracking-tight"
          >
            Anchor
          </Link>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <PrimaryNav />
            <ReachSupportLink />
          </div>
        </div>
      </header>

      {/* Calm, persistent disclaimer — visible on every screen, not buried. */}
      <div className="border-b border-drifting-border bg-drifting-soft">
        <p className="mx-auto max-w-content px-5 py-2 text-xs leading-relaxed text-ink-muted sm:px-6">
          A staying-well <span className="font-medium text-ink">prototype</span>,
          not a medical device or diagnostic tool. It supports your care, it never
          replaces it.
        </p>
      </div>

      <main
        id="main-content"
        tabIndex={-1}
        className="anchor-rise mx-auto max-w-content px-5 py-12 focus:outline-none sm:px-6 sm:py-16"
      >
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
          Anchor is an unvalidated prototype, not a medical device or a
          diagnostic tool, and makes no medical claims. It reflects your own
          pre-agreed early-warning signs back to you and helps you reach real
          human support. It supports clinical care, it never replaces it. If you
          are in crisis, contact your care team or local emergency services.
        </p>
        <ReachSupport />
      </footer>
    </div>
  );
}
