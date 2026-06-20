import Link from "next/link";
import { Button } from "@/components/Button";
import { PrototypeNotice } from "@/components/PrototypeNotice";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <main className="mx-auto flex max-w-content flex-col items-start px-6 py-24 sm:py-32">
        <span className="rounded-pill bg-steady-100 px-4 py-1.5 text-sm font-medium text-steady-700">
          A calm staying-well companion
        </span>

        <h1 className="mt-8 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Anchor reflects your own early-warning signs back to you.
        </h1>

        <p className="mt-6 max-w-prose text-lg leading-relaxed text-ink-muted">
          Anchor helps people managing psychosis or schizophrenia notice the
          signs they&rsquo;ve already chosen to watch for — in their own words
          — and reach the real people who can help. It supports clinical care.
          It never replaces it.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button href="/onboarding">Get started</Button>
          <Button href="/checkin" variant="ghost">
            Do a check-in
          </Button>
        </div>

        <div className="mt-20 grid w-full gap-6 sm:grid-cols-3">
          <Principle
            title="Not diagnostic"
            body="Anchor makes no medical claims. It mirrors your pre-agreed signs back to you — nothing more."
          />
          <Principle
            title="Transparent by design"
            body="Every zone comes from an inspectable rules engine you and your care team set together. Never from an AI."
          />
          <Principle
            title="Your data, yours"
            body="Your signs, notes and plan belong to you. You can read, export or erase them at any time."
          />
        </div>

        <div className="mt-20">
          <PrototypeNotice />
        </div>

        <p className="mt-8 text-sm leading-relaxed text-ink-faint">
          If you are in crisis, please contact your care team or local emergency
          services.{" "}
          <Link href="/plan" className="underline hover:text-ink-muted">
            See your plan
          </Link>
          .
        </p>
      </main>
    </div>
  );
}

function Principle({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-card border border-line bg-surface p-6 shadow-card">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{body}</p>
    </div>
  );
}
