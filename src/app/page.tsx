import Link from "next/link";
import { PrototypeNotice } from "@/components/PrototypeNotice";
import { WaitlistForm } from "@/components/WaitlistForm";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-line/70">
        <div className="mx-auto flex max-w-content items-center justify-between px-5 py-4 sm:px-6">
          <span className="text-lg font-semibold tracking-tight">Anchor</span>
          <Link
            href="#waitlist"
            className="rounded-pill px-4 py-2 text-sm font-medium text-accent-text hover:bg-accent-soft"
          >
            Join the waitlist
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-content px-5 py-16 sm:px-6 sm:py-24">
        {/* Hero */}
        <section>
          <span className="rounded-pill bg-accent-soft px-4 py-1.5 text-sm font-medium text-accent-text">
            A calm staying-well companion
          </span>
          <h1 className="mt-6 font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Notice your early signs, in your own words, and reach the people who
            can help.
          </h1>
          <p className="mt-6 max-w-prose text-lg leading-relaxed text-ink-muted">
            Anchor helps people living with psychosis or schizophrenia keep an eye
            on their <em>own</em> pre-agreed early-warning signs, and reach real
            human support when those signs drift from their normal. It&rsquo;s
            built to feel calm on a hard day. It supports your care, it never
            replaces it.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="#waitlist"
              className="inline-flex min-h-[3rem] items-center justify-center rounded-pill bg-accent px-7 py-3 text-lg font-medium text-accent-foreground hover:bg-accent-strong"
            >
              Join the waitlist
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex min-h-[3rem] items-center justify-center rounded-pill border border-accent/40 px-7 py-3 text-lg font-medium text-accent-text hover:bg-accent-soft"
            >
              See the prototype
            </Link>
          </div>
        </section>

        {/* Honesty */}
        <section className="mt-14">
          <PrototypeNotice />
        </section>

        {/* How it works */}
        <section className="mt-20">
          <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <Step
              n="1"
              title="Set it up on a good day"
              body="While you're well, ideally with your care team, you choose the early-warning signs you want to watch for, in your own words, and who you'd want to reach."
            />
            <Step
              n="2"
              title="A 30-second check-in"
              body="A gentle daily check-in: how you slept, your mood, and any of your own signs. When things are steady, it shortens to a single tap."
            />
            <Step
              n="3"
              title="Mirrored back, with help nearby"
              body="If your signs drift from your normal, Anchor reflects that back calmly and helps you reach a real person: a friend, family member, or your care team."
            />
          </div>
        </section>

        {/* Principles */}
        <section className="mt-20">
          <h2 className="text-2xl font-semibold tracking-tight">
            Built honestly, on three promises
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <Principle
              title="Not diagnostic"
              body="Anchor makes no medical claims and doesn't judge you. It mirrors the signs you chose, nothing more."
            />
            <Principle
              title="Transparent, not a black box"
              body="Every zone comes from a simple, inspectable rule you can read, learned from your own check-ins, never decided by an AI."
            />
            <Principle
              title="Your data is yours"
              body="Your signs, notes and plan live on your device. You can read, export, or erase all of it, and control exactly what anyone else sees."
            />
          </div>
        </section>

        {/* Who it's for */}
        <section className="mt-20">
          <h2 className="text-2xl font-semibold tracking-tight">Who it&rsquo;s for</h2>
          <p className="mt-4 max-w-prose text-lg leading-relaxed text-ink-muted">
            For people managing psychosis or schizophrenia who want a calmer way
            to stay well between appointments, and for the families, friends and
            care teams around them. If you&rsquo;re a clinician, researcher or
            commissioner, we&rsquo;d genuinely love to hear what would make this
            useful and safe in real care.
          </p>
        </section>

        {/* Waitlist */}
        <section id="waitlist" className="mt-20 scroll-mt-8">
          <div className="rounded-card border border-line bg-surface p-6 shadow-card sm:p-10">
            <h2 className="text-2xl font-semibold tracking-tight">
              Tell us you&rsquo;re interested
            </h2>
            <p className="mt-3 max-w-prose leading-relaxed text-ink-muted">
              We&rsquo;re early, and building this carefully and in the open. If
              this resonates, whether for yourself, someone you support, or the
              people you care for, leave your email and we&rsquo;ll keep you posted.
            </p>
            <div className="mt-8 max-w-xl">
              <WaitlistForm />
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-20 border-t border-line pt-8">
          <p className="text-sm leading-relaxed text-ink-faint">
            Anchor is an unvalidated prototype, not a medical device or a
            diagnostic tool, and makes no medical claims. It supports clinical
            care, it never replaces it. If you are in crisis, contact your care
            team or local emergency services.
          </p>
          <p className="mt-4 text-sm text-ink-faint">
            Already set up?{" "}
            <Link href="/dashboard" className="font-medium text-accent-text underline">
              go to your Anchor
            </Link>
            .
          </p>
        </footer>
      </main>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="rounded-card border border-line bg-surface p-6 shadow-card">
      <span className="flex h-9 w-9 items-center justify-center rounded-pill bg-accent-soft font-semibold text-accent-text">
        {n}
      </span>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 leading-relaxed text-ink-muted">{body}</p>
    </div>
  );
}

function Principle({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-card border border-line bg-surface p-6 shadow-card">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 leading-relaxed text-ink-muted">{body}</p>
    </div>
  );
}
