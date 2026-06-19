"use client";

import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Card } from "@/components/Card";
import { ZoneBadge } from "@/components/ZoneBadge";
import { ZONE_STYLES } from "@/design/tokens";
import { evaluateZone } from "@/lib/rules-engine";
import { useProfile } from "@/lib/useProfile";

export default function DashboardPage() {
  const { profile, loading } = useProfile();

  if (loading) return <PageShell title="Your dashboard">{null}</PageShell>;

  if (!profile?.onboardedAt) {
    return (
      <PageShell
        title="Your dashboard"
        intro="Once your Anchor is set up, this is where your own picture lives."
      >
        <Card>
          <Link
            href="/onboarding"
            className="rounded-pill bg-steady-400 px-7 py-3 font-medium text-white hover:bg-steady-500"
          >
            Set up my Anchor
          </Link>
        </Card>
      </PageShell>
    );
  }

  const latest = profile.checkIns[profile.checkIns.length - 1];

  if (!latest) {
    return (
      <PageShell
        title={`Hi${profile.displayName ? `, ${profile.displayName}` : ""}`}
        intro="Your Anchor is ready. Whenever you feel like it, do a gentle check-in and your picture will appear here."
      >
        <Card>
          <Link
            href="/checkin"
            className="rounded-pill bg-steady-400 px-7 py-3 font-medium text-white hover:bg-steady-500"
          >
            Do my first check-in
          </Link>
        </Card>
      </PageShell>
    );
  }

  // The zone comes ENTIRELY from the transparent rules engine.
  const result = evaluateZone({
    signs: profile.signs,
    checkIn: latest,
    baseline: profile.baseline,
  });
  const zone = profile.zones[result.zone];
  const style = ZONE_STYLES[result.zone];
  const reachable = profile.trustedContacts.filter(
    (c) => zoneRank(c.alertAtZone) <= zoneRank(result.zone),
  );

  return (
    <PageShell
      title={`Hi${profile.displayName ? `, ${profile.displayName}` : ""}`}
      intro="A calm summary, based only on your own signs. The reasons behind the zone are always shown in full — nothing is hidden."
    >
      <Card className={style.softBg}>
        <div className="flex items-center justify-between">
          <ZoneBadge zone={result.zone} label={zone.label} />
          <span className="text-sm text-ink-faint">
            {new Date(latest.createdAt).toLocaleDateString()}
          </span>
        </div>
        <p className="mt-4 text-lg leading-relaxed text-ink">{result.message}</p>
        {zone.description ? (
          <p className="mt-2 text-sm text-ink-faint">Your words: {zone.description}</p>
        ) : null}
      </Card>

      <Card>
        <h2 className="text-xl font-semibold">Why this zone?</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-faint">
          {result.presentCount} of your signs showing. Your thresholds: amber at{" "}
          {result.baseline.amberAt}, red at {result.baseline.redAt}. Decided by
          the rules engine, not an AI. Every input is listed below.
        </p>
        <ul className="mt-6 space-y-2">
          {result.reasons.map((r) => (
            <li
              key={r.signId}
              className="flex items-center justify-between rounded-2xl border border-line px-5 py-3"
            >
              <span className={r.present ? "text-ink" : "text-ink-faint"}>
                {r.signName}
              </span>
              <span className="text-sm text-ink-faint">
                {r.present ? "present" : "not present"}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {result.zone !== "green" && profile.stayingWellActions.length > 0 && (
        <Card>
          <h2 className="text-xl font-semibold">Things that help you</h2>
          <ul className="mt-4 space-y-2 text-ink-muted">
            {profile.stayingWellActions.map((a) => (
              <li key={a.id}>• {a.text}</li>
            ))}
          </ul>
        </Card>
      )}

      {result.zone !== "green" && reachable.length > 0 && (
        <Card className={style.softBg}>
          <h2 className="text-xl font-semibold">People you might reach</h2>
          <ul className="mt-4 space-y-2">
            {reachable.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-2xl border border-line bg-surface px-5 py-3"
              >
                <span>
                  <span className="font-medium text-ink">{c.name}</span>
                  <span className="block text-sm text-ink-faint">{c.relationship}</span>
                </span>
                {c.phone ? (
                  <a href={`tel:${c.phone}`} className="text-sm font-medium text-steady-700">
                    {c.phone}
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </PageShell>
  );
}

function zoneRank(zone: "green" | "amber" | "red"): number {
  return zone === "green" ? 0 : zone === "amber" ? 1 : 2;
}
