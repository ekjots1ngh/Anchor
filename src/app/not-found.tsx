import Link from "next/link";

/** A calm dead end. No error jargon, one clear way back. */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-center text-ink">
      <p className="text-sm font-medium uppercase tracking-wide text-ink-faint">
        Anchor
      </p>
      <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight">
        That page isn&rsquo;t here.
      </h1>
      <p className="mt-3 max-w-prose leading-relaxed text-ink-muted">
        No harm done. Everything you&rsquo;ve saved is safe.
      </p>
      <Link
        href="/dashboard"
        className="mt-8 inline-flex min-h-[2.75rem] items-center rounded-pill bg-accent px-7 py-3 font-medium text-accent-foreground hover:bg-accent-strong"
      >
        Back to Anchor
      </Link>
    </div>
  );
}
