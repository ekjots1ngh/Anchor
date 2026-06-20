"use client";

import { useEffect, useState } from "react";
import { ZoneBadge } from "@/components/ZoneBadge";
import { ZONE_STYLES } from "@/design/tokens";
import { trendBar } from "@/lib/dashboard";
import { useProfile } from "@/lib/useProfile";
import {
  canSupporterAccess,
  supporterSummary,
  type DriftLevel,
  type SupporterView,
} from "@/lib/supporter";
import type { ZoneId } from "@/lib/types";

const ZONE_BLURB: Record<ZoneId, string> = {
  green: "Doing steadily — their own signs are in their usual range.",
  amber: "A few of their signs have been drifting — a good time for a gentle, supportive check-in.",
  red: "Several signs have drifted and stayed there — they may need real support now. If you're worried, reach out to them or their care team.",
};

const LEVEL_PILL: Record<DriftLevel, string> = {
  steady: "bg-steady-100 text-steady-700",
  some: "bg-checkin-100 text-checkin-700",
  elevated: "bg-crisis-100 text-crisis-700",
};

const LEVEL_LABEL: Record<DriftLevel, string> = {
  steady: "Steady",
  some: "Some",
  elevated: "Elevated",
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-line/70">
        <div className="mx-auto max-w-content px-5 py-4 sm:px-6">
          <span className="text-lg font-semibold tracking-tight">Anchor</span>
          <span className="ml-2 text-sm text-ink-faint">· a shared summary</span>
        </div>
      </header>
      <main className="mx-auto max-w-content px-5 py-12 sm:px-6 sm:py-16">
        {children}
      </main>
    </div>
  );
}

export default function SupporterPage() {
  const { profile, loading } = useProfile();
  const [token, setToken] = useState<string | null>(null);
  const [tokenRead, setTokenRead] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token"));
    setTokenRead(true);
  }, []);

  if (loading || !tokenRead) {
    return (
      <Shell>
        <p className="text-ink-muted">Loading…</p>
      </Shell>
    );
  }

  if (!canSupporterAccess(profile, token)) {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold tracking-tight">
          This shared summary isn&rsquo;t available
        </h1>
        <p className="mt-4 max-w-prose leading-relaxed text-ink-muted">
          This link may have been turned off, or it&rsquo;s being opened on a
          different device than the one it was shared from. Access is controlled
          by the person who shared it, and they can turn it off at any time.
        </p>
      </Shell>
    );
  }

  const view = supporterSummary(profile!);
  return (
    <Shell>
      <Summary view={view} />
    </Shell>
  );
}

function Summary({ view }: { view: SupporterView }) {
  const style = ZONE_STYLES[view.currentZone];
  return (
    <div className="space-y-8">
      <div className="rounded-card border border-line bg-surface p-4 text-sm leading-relaxed text-ink-muted">
        <strong className="text-ink">{view.firstName}</strong> has chosen to share
        a read-only summary with you. You&rsquo;re seeing their zones and trends
        only — never their private notes — and they can turn this off at any time.
      </div>

      {/* Current zone */}
      <div className={`rounded-card border border-line p-6 shadow-card sm:p-8 ${style.softBg} ring-1 ${style.ring}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ZoneBadge zone={view.currentZone} label={view.currentZoneLabel} />
          {view.updatedAt ? (
            <span className="text-sm text-ink-faint">
              as of {new Date(view.updatedAt).toLocaleDateString()}
            </span>
          ) : null}
        </div>
        <p className="mt-4 text-lg leading-relaxed text-ink">
          {view.warmingUp
            ? `Anchor is still learning ${view.firstName}'s usual range — there isn't enough history yet for a reliable picture.`
            : ZONE_BLURB[view.currentZone]}
        </p>
        <p className="mt-3 text-sm text-ink-faint">
          Based on {view.checkInCount}{" "}
          {view.checkInCount === 1 ? "check-in" : "check-ins"}.
        </p>
      </div>

      {/* Zone trend */}
      {view.includeTrends && view.trend.length > 0 && (
        <div className="rounded-card border border-line bg-surface p-6 shadow-card sm:p-8">
          <h2 className="text-lg font-semibold">Recent zones</h2>
          <p className="mt-1 text-sm text-ink-faint">
            The last 14 days — zones only, no details.
          </p>
          <div className="mt-5 flex items-end gap-1.5" aria-hidden>
            {view.trend.map((p, i) => (
              <div
                key={i}
                className={`h-10 flex-1 rounded ${
                  p.zone ? trendBar(p.zone) : "border border-dashed border-line"
                }`}
                title={`${new Date(p.date).toLocaleDateString()}${p.zone ? ` · ${p.zone}` : " · no check-in"}`}
              />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-ink-faint">
            <Legend swatch="bg-steady-300" label="Steady" />
            <Legend swatch="bg-checkin-300" label="Drifting" />
            <Legend swatch="bg-crisis-300" label="Worth support" />
            <Legend swatch="border border-dashed border-line" label="No check-in" />
          </div>
        </div>
      )}

      {/* Drift areas (generic) */}
      {view.includeDriftAreas && view.driftAreas.length > 0 && (
        <div className="rounded-card border border-line bg-surface p-6 shadow-card sm:p-8">
          <h2 className="text-lg font-semibold">Areas being watched</h2>
          <p className="mt-1 text-sm text-ink-faint">
            Broad areas only — not the specific, personal details.
          </p>
          <ul className="mt-5 space-y-2">
            {view.driftAreas.map((a) => (
              <li
                key={a.label}
                className="flex items-center justify-between rounded-2xl border border-line px-5 py-3"
              >
                <span className="text-ink">{a.label}</span>
                <span className={`rounded-pill px-3 py-1 text-sm font-medium ${LEVEL_PILL[a.level]}`}>
                  {LEVEL_LABEL[a.level]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-sm leading-relaxed text-ink-faint">
        This is a summary {view.firstName} chose to share with you. It is not a
        medical record and makes no clinical claims. It mirrors their own
        pre-agreed early-warning signs — it does not diagnose. If you&rsquo;re
        concerned, the most helpful thing is to talk with them, or contact their
        care team.
      </p>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-3 w-3 rounded-pill ${swatch}`} aria-hidden />
      {label}
    </span>
  );
}
