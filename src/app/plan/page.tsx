"use client";

import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Card } from "@/components/Card";
import { ZoneBadge } from "@/components/ZoneBadge";
import { ContactActions } from "@/components/ContactActions";
import { useProfile } from "@/lib/useProfile";
import { telHref } from "@/lib/contact";
import { ZONE_STYLES } from "@/design/tokens";
import { CONTACT_VISIBILITY_LABELS, type ZoneId } from "@/lib/types";

const ZONE_ORDER: ZoneId[] = ["green", "amber", "red"];

export default function PlanPage() {
  const { profile, loading } = useProfile();

  if (loading)
    return (
      <PageShell title="Your staying-well plan">
        <p className="text-ink-muted">Loading…</p>
      </PageShell>
    );

  if (!profile?.onboardedAt) {
    return (
      <PageShell
        title="Your staying-well plan"
        intro="Your plan appears here once you've set up your Anchor."
      >
        <Card>
          <Link
            href="/onboarding"
            className="rounded-pill bg-steady-600 px-7 py-3 font-medium text-white hover:bg-steady-700"
          >
            Set up my Anchor
          </Link>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Your staying-well plan"
      intro="This is your plan, in your words. Anchor only ever mirrors it back. It never decides anything about your care."
    >
      <Card>
        <h2 className="text-xl font-semibold">Your zones</h2>
        <div className="mt-4 space-y-3">
          {ZONE_ORDER.map((id) => {
            const z = profile.zones[id];
            return (
              <div
                key={id}
                className={`rounded-2xl border border-line p-4 ${ZONE_STYLES[id].softBg}`}
              >
                <ZoneBadge zone={id} label={z.label} />
                <p className="mt-2 text-sm text-ink-muted">{z.description}</p>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold">Signs you're watching</h2>
        <ul className="mt-4 space-y-2">
          {profile.signs.map((s) => (
            <li key={s.id} className="rounded-2xl border border-line px-4 py-3">
              <span className="font-medium text-ink">{s.name}</span>
              <span className="block text-sm text-ink-faint">{s.description}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold">What helps you stay steady</h2>
        <ul className="mt-4 space-y-2 text-ink-muted">
          {profile.stayingWellActions.map((a) => (
            <li key={a.id}>• {a.text}</li>
          ))}
        </ul>
      </Card>

      <Card id="circle">
        <h2 className="text-xl font-semibold">Your trusted circle</h2>
        <p className="mt-1 text-sm text-ink-faint">
          Reach any of them in one tap. The message comes pre-filled, and you
          send it from your own phone.
        </p>
        <ul className="mt-4 space-y-3">
          {profile.trustedContacts.map((c) => (
            <li key={c.id} className="rounded-2xl border border-line px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span>
                  <span className="font-medium text-ink">{c.name}</span>
                  <span className="block text-sm text-ink-faint">
                    {c.relationship}
                    {c.phone ? ` · ${c.phone}` : ""}
                  </span>
                </span>
                <ZoneBadge zone={c.alertAtZone} label={profile.zones[c.alertAtZone].label} />
              </div>
              <p className="mt-2 text-sm text-ink-faint">
                Sees: {CONTACT_VISIBILITY_LABELS[c.visibility ?? "nudge"].toLowerCase()}
              </p>
              <div className="mt-3">
                <ContactActions contact={c} />
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold">Crisis line</h2>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <span className="text-ink">
            <span className="font-medium">{profile.crisisPlan.crisisLineName}</span>
            <span className="text-ink-faint"> · {profile.crisisPlan.crisisLinePhone}</span>
          </span>
          <a
            href={telHref(profile.crisisPlan.crisisLinePhone)}
            className="inline-flex min-h-[2.75rem] items-center justify-center rounded-pill bg-crisis-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-crisis-600"
          >
            Call now
          </a>
        </div>
        {profile.crisisPlan.whatHelps ? (
          <p className="mt-3 text-sm text-ink-muted">
            <span className="text-ink-faint">What helps: </span>
            {profile.crisisPlan.whatHelps}
          </p>
        ) : null}
        {profile.crisisPlan.whatToAvoid ? (
          <p className="mt-1 text-sm text-ink-muted">
            <span className="text-ink-faint">What to avoid: </span>
            {profile.crisisPlan.whatToAvoid}
          </p>
        ) : null}
        {profile.crisisPlan.notes ? (
          <p className="mt-1 text-sm text-ink-muted">
            <span className="text-ink-faint">Notes: </span>
            {profile.crisisPlan.notes}
          </p>
        ) : null}
      </Card>

      <Card>
        <h2 className="text-xl font-semibold">Your data</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Everything here belongs to you and lives only on this device. See
          exactly what&rsquo;s stored, take a copy, erase it all, or change what
          each person can see, all in one place.
        </p>
        <div className="mt-5">
          <Link
            href="/data"
            className="inline-flex min-h-[2.75rem] items-center rounded-pill border border-steady-300 px-5 py-2.5 font-medium text-steady-700 hover:bg-steady-50"
          >
            Open Your data
          </Link>
        </div>
      </Card>
    </PageShell>
  );
}
