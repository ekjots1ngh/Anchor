"use client";

import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Card } from "@/components/Card";
import { ZoneBadge } from "@/components/ZoneBadge";
import { WarmMessage } from "@/components/WarmMessage";
import { WhyThisZone } from "@/components/WhyThisZone";
import { ConnectActions } from "@/components/ConnectActions";
import { OkayCorrection } from "@/components/OkayCorrection";
import { ZONE_STYLES } from "@/design/tokens";
import { useProfile } from "@/lib/useProfile";
import { computeZoneForProfile } from "@/lib/zone";
import { buildTrend, signalStatus, statusCopy, trendBar } from "@/lib/dashboard";

export default function DashboardPage() {
  const { profile, loading } = useProfile();

  if (loading)
    return (
      <PageShell title="Your dashboard">
        <p className="text-ink-muted">Loading your picture…</p>
      </PageShell>
    );

  if (!profile?.onboardedAt) {
    return (
      <PageShell
        title="Your dashboard"
        intro="Once your Anchor is set up, this is where your own picture lives."
      >
        <Card>
          <Link
            href="/onboarding"
            className="inline-flex rounded-pill bg-steady-600 px-7 py-3 font-medium text-white hover:bg-steady-700"
          >
            Set up my Anchor
          </Link>
        </Card>
      </PageShell>
    );
  }

  const firstName = profile.displayName?.trim().split(" ")[0] || undefined;

  if (profile.checkIns.length === 0) {
    return (
      <PageShell
        title={`Hi${firstName ? `, ${firstName}` : ""}`}
        intro="Your Anchor is ready. Whenever you feel like it, do a gentle 30-second check-in and your picture will appear here."
      >
        <Card>
          <Link
            href="/checkin"
            className="inline-flex rounded-pill bg-steady-600 px-7 py-3 font-medium text-white hover:bg-steady-700"
          >
            Do my first check-in
          </Link>
        </Card>
      </PageShell>
    );
  }

  // Everything below is pulled from the transparent zone engine.
  const result = computeZoneForProfile(profile);
  const zoneWord = profile.zones[result.zone];
  const style = ZONE_STYLES[result.zone];
  const copy = statusCopy(result, zoneWord.label, firstName);
  const trend = buildTrend(profile);
  const watching = result.drivers;

  const topWhy = watching
    .filter((d) => d.drift > 0)
    .slice(0, 3)
    .map((d) => d.label);

  // Show a brief acknowledgement right after an "I'm actually okay" correction
  // tips the dashboard back to green.
  const lastCorrection = (profile.corrections ?? []).slice(-1)[0];
  const justCorrected =
    result.zone === "green" &&
    !!lastCorrection &&
    Date.now() - new Date(lastCorrection.createdAt).getTime() < 120_000;

  return (
    <PageShell title="Your dashboard">
      {/* Calm status card */}
      <Card id="present-status" className={`${style.softBg} ring-1 ${style.ring}`}>
        <div className="flex items-center justify-between">
          <ZoneBadge zone={result.zone} label={zoneWord.label} />
          <span className="text-sm text-ink-faint">
            Based on your last {result.windowSize}{" "}
            {result.windowSize === 1 ? "check-in" : "check-ins"}
          </span>
        </div>
        <h2 className="mt-5 text-2xl font-semibold tracking-tight">{copy.headline}</h2>
        {result.zone === "green" ? (
          <>
            <p className="mt-3 text-lg leading-relaxed text-ink-muted">{copy.body}</p>
            {justCorrected && (
              <p className="mt-3 rounded-2xl bg-steady-50 px-4 py-3 text-sm text-steady-700">
                Thanks for telling me. I&rsquo;ve noted this as normal for you and
                nudged your baseline, so I won&rsquo;t flag it at this level again.
              </p>
            )}
          </>
        ) : (
          // Amber/red only: a warm, LLM-phrased note (server-side; falls back to
          // the deterministic copy if messaging isn't available).
          <WarmMessage
            className="mt-3"
            zone={result.zone}
            zoneLabel={zoneWord.label}
            drivers={watching
              .filter((d) => d.drift > 0)
              .map((d) => ({ label: d.label, drift: d.drift }))}
            stayingWellActions={profile.stayingWellActions.map((a) => a.text)}
            firstName={firstName}
            fallback={copy.body}
          />
        )}
        <WhyThisZone result={result} zoneLabel={zoneWord.label} />
      </Card>

      {/* Amber/red: connect to a real person, fast. Anchor is the nudge. */}
      {result.zone !== "green" && (
        <ConnectActions
          id="present-reach"
          profile={profile}
          zone={result.zone}
          zoneLabel={zoneWord.label}
          signalLabels={topWhy}
        />
      )}

      {/* Amber only (never red): let the person correct a false alarm. The
          crisis/connect path above is unaffected, and the engine still forces
          red on a genuine crisis regardless of corrections. */}
      {result.zone === "amber" && (
        <OkayCorrection profile={profile} drivers={result.drivers} />
      )}

      {/* 7-day trend */}
      <Card>
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Your last 7 days</h2>
          <span className="text-sm text-ink-faint">A gentle trend, not a grade</span>
        </div>
        <div className="mt-6 flex items-end justify-between gap-2 sm:gap-3" aria-hidden="true">
          {trend.map((day, i) => {
            const heightPct = day.zone ? Math.max(8, Math.round(day.score * 100)) : 0;
            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-24 w-full items-end justify-center">
                  {day.zone ? (
                    <div
                      className={`w-full max-w-[2.25rem] rounded-pill ${trendBar(day.zone)}`}
                      style={{ height: `${heightPct}%` }}
                      title={`${day.date.toLocaleDateString()} · ${day.zone}`}
                    />
                  ) : (
                    <div
                      className="w-full max-w-[2.25rem] rounded-pill border border-dashed border-line"
                      style={{ height: "8%" }}
                      title={`${day.date.toLocaleDateString()} · no check-in`}
                    />
                  )}
                </div>
                <span
                  className={`text-xs ${
                    day.isToday ? "font-semibold text-ink" : "text-ink-faint"
                  }`}
                >
                  {day.weekday}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-5 flex flex-wrap gap-4 text-xs text-ink-faint">
          <Legend swatch="bg-steady-300" label="Steady" />
          <Legend swatch="bg-checkin-300" label="Drifting" />
          <Legend swatch="bg-crisis-300" label="Worth support" />
          <Legend swatch="border border-dashed border-line" label="No check-in" />
        </div>
      </Card>

      {/* What I'm watching */}
      <Card>
        <h2 className="text-lg font-semibold">What I&rsquo;m watching</h2>
        <p className="mt-1 text-sm text-ink-faint">
          Each signal and how far it&rsquo;s drifted from your baseline lately.
        </p>
        <ul className="mt-5 space-y-3">
          {watching.map((d) => {
            const status = signalStatus(d.drift);
            return (
              <li key={d.signal} className="rounded-2xl border border-line px-5 py-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-ink">{d.label}</span>
                  <span
                    className={`rounded-pill px-3 py-1 text-sm font-medium ${status.pill}`}
                  >
                    {status.label}
                  </span>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-pill bg-canvas">
                  <div
                    className={`h-full rounded-pill ${status.bar}`}
                    style={{ width: `${Math.max(4, Math.round(d.drift * 100))}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* Gentle support, only when it's useful */}
      {result.zone !== "green" && profile.stayingWellActions.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold">Things that help you</h2>
          <ul className="mt-4 space-y-2 text-ink-muted">
            {profile.stayingWellActions.map((a) => (
              <li key={a.id}>• {a.text}</li>
            ))}
          </ul>
        </Card>
      )}

    </PageShell>
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
