"use client";

import Link from "next/link";
import { useProfile } from "@/lib/useProfile";
import { computeZone, computeZoneForProfile } from "@/lib/zone";
import { dayKey } from "@/lib/dashboard";
import {
  SIGN_CATEGORY_BLURBS,
  SIGN_CATEGORY_LABELS,
  type SignCategory,
  type ZoneId,
} from "@/lib/types";

const CATEGORY_ORDER: SignCategory[] = [
  "sleep",
  "social",
  "thinking",
  "function",
  "mood",
];

const ZONE_ORDER: ZoneId[] = ["green", "amber", "red"];

const PLAIN_ZONE: Record<ZoneId, string> = {
  green: "steady",
  amber: "drifting a little",
  red: "a harder stretch, worth real support",
};

/**
 * A plain-language summary the person can print or save as a PDF and bring to an
 * appointment. It is a calm, readable document — not a clinical record — that
 * reinforces, throughout, that Anchor supports care and never replaces it.
 *
 * Deliberately a standalone layout (no app chrome) so it prints cleanly.
 */
export default function SummaryPage() {
  const { profile, loading } = useProfile();

  if (loading) {
    return (
      <Frame>
        <p className="text-ink-muted">Loading…</p>
      </Frame>
    );
  }

  if (!profile?.onboardedAt) {
    return (
      <Frame>
        <h1 className="text-2xl font-semibold tracking-tight">
          A summary to share with your care team
        </h1>
        <p className="mt-3 leading-relaxed text-ink-muted">
          Once your Anchor is set up, you can print a plain-language summary here
          to talk through at an appointment.
        </p>
        <Link
          href="/onboarding"
          className="mt-6 inline-flex min-h-[2.75rem] items-center rounded-pill bg-steady-600 px-7 py-3 font-medium text-white hover:bg-steady-700"
        >
          Set up my Anchor
        </Link>
      </Frame>
    );
  }

  const name = profile.displayName?.trim() || "This person";
  const current = computeZoneForProfile(profile);
  const currentLabel = profile.zones[current.zone].label;
  const generated = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // A gentle 14-day overview: how often they checked in, and a plain breakdown
  // of how those days read. No raw scores, no grades.
  const counts = { green: 0, amber: 0, red: 0 } as Record<ZoneId, number>;
  let checkInDays = 0;
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const has = profile.checkIns.some(
      (c) => dayKey(new Date(c.createdAt)) === dayKey(date),
    );
    if (!has) continue;
    checkInDays += 1;
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    const upTo = profile.checkIns.filter(
      (c) => new Date(c.createdAt).getTime() <= endOfDay.getTime(),
    );
    const reading = computeZone({ signs: profile.signs, checkIns: upTo });
    counts[reading.zone] += 1;
  }

  const signsByCategory = CATEGORY_ORDER.map((cat) => ({
    cat,
    signs: profile.signs.filter((s) => s.category === cat),
  })).filter((g) => g.signs.length > 0);

  return (
    <Frame>
      {/* Screen-only controls */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/data"
          className="inline-flex min-h-[2.75rem] items-center rounded-pill px-4 py-2 text-sm font-medium text-ink-muted hover:bg-steady-50"
        >
          ← Back to your data
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex min-h-[2.75rem] items-center rounded-pill bg-steady-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-steady-700"
        >
          Print or save as PDF
        </button>
      </div>

      <header>
        <h1 className="text-3xl font-semibold tracking-tight">
          {name}&rsquo;s staying-well summary
        </h1>
        <p className="mt-2 text-ink-muted">Prepared {generated}</p>
      </header>

      {/* Honest, calm framing for whoever reads it */}
      <p className="mt-6 rounded-2xl border border-checkin-200 bg-checkin-50/60 px-5 py-4 text-sm leading-relaxed text-ink">
        This is a personal summary {profile.displayName?.trim() || "the person"}{" "}
        chose to share, in their own words. It is <strong>not a medical record</strong>{" "}
        and makes no diagnosis. Anchor supports their care, it never replaces it.
        {profile.setupTogether
          ? " It was set up together with someone they trust."
          : ""}
      </p>

      {profile.baseline.description ? (
        <Section title="What steady looks like for me">
          <p className="leading-relaxed text-ink">{profile.baseline.description}</p>
        </Section>
      ) : null}

      <Section title="My early-warning signs">
        <p className="mb-4 text-sm leading-relaxed text-ink-muted">
          The signs {name} chose to watch for, in their own words, grouped by
          area.
        </p>
        <div className="space-y-5">
          {signsByCategory.map(({ cat, signs }) => (
            <div key={cat}>
              <h3 className="font-medium text-ink">{SIGN_CATEGORY_LABELS[cat]}</h3>
              <p className="text-sm text-ink-faint">{SIGN_CATEGORY_BLURBS[cat]}</p>
              <ul className="mt-2 space-y-1.5">
                {signs.map((s) => (
                  <li key={s.id} className="leading-relaxed text-ink">
                    <span className="font-medium">{s.name}</span>
                    {s.description ? (
                      <span className="text-ink-muted">: {s.description}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section title="My zones, in my words">
        <ul className="space-y-3">
          {ZONE_ORDER.map((z) => (
            <li key={z} className="leading-relaxed">
              <span className="font-medium text-ink">{profile.zones[z].label}</span>
              {profile.zones[z].description ? (
                <span className="text-ink-muted">: {profile.zones[z].description}</span>
              ) : null}
            </li>
          ))}
        </ul>
      </Section>

      {profile.stayingWellActions.length > 0 ? (
        <Section title="What helps me stay steady">
          <ul className="space-y-1.5">
            {profile.stayingWellActions.map((a) => (
              <li key={a.id} className="leading-relaxed text-ink">
                • {a.text}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {profile.trustedContacts.length > 0 ? (
        <Section title="People I'd want reached">
          <ul className="space-y-2">
            {profile.trustedContacts.map((c) => (
              <li key={c.id} className="leading-relaxed text-ink">
                <span className="font-medium">{c.name}</span>
                <span className="text-ink-muted">
                  {c.relationship ? ` · ${c.relationship}` : ""}
                  {` · reach me from "${profile.zones[c.alertAtZone].label}"`}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title="My crisis line">
        <p className="leading-relaxed text-ink">
          <span className="font-medium">{profile.crisisPlan.crisisLineName}</span>
          <span className="text-ink-muted"> · {profile.crisisPlan.crisisLinePhone}</span>
        </p>
        {profile.crisisPlan.whatHelps ? (
          <p className="mt-2 text-sm text-ink-muted">
            <span className="text-ink-faint">What helps in a crisis: </span>
            {profile.crisisPlan.whatHelps}
          </p>
        ) : null}
        {profile.crisisPlan.whatToAvoid ? (
          <p className="mt-1 text-sm text-ink-muted">
            <span className="text-ink-faint">What to avoid: </span>
            {profile.crisisPlan.whatToAvoid}
          </p>
        ) : null}
      </Section>

      <Section title="Recent check-ins">
        {checkInDays === 0 ? (
          <p className="leading-relaxed text-ink-muted">
            No check-ins in the last two weeks. That&rsquo;s okay, there&rsquo;s no
            penalty for time away.
          </p>
        ) : (
          <>
            <p className="leading-relaxed text-ink">
              Over the last two weeks, {name} checked in on {checkInDays}{" "}
              {checkInDays === 1 ? "day" : "days"}. Right now Anchor reads{" "}
              <span className="font-medium">{currentLabel}</span> ({PLAIN_ZONE[current.zone]})
              {current.warmingUp
                ? ", and is still learning their usual range"
                : ""}
              .
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              Of those days: {counts.green} steady, {counts.amber} drifting a
              little, {counts.red} worth support.
            </p>
          </>
        )}
      </Section>

      <footer className="mt-10 border-t border-line pt-6 text-sm leading-relaxed text-ink-faint">
        Anchor reflects {name}&rsquo;s own pre-agreed early-warning signs back to
        them and helps them reach real human support sooner. It does not predict,
        prevent, diagnose, or treat anything, and it makes no clinical claims. It
        supports {name}&rsquo;s care, it never replaces it.
      </footer>
    </Frame>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas text-ink print:bg-white">
      <main className="mx-auto max-w-content px-5 py-12 sm:px-6 sm:py-16 print:py-0">
        {children}
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 break-inside-avoid">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
