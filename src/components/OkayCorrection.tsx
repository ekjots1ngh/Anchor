"use client";

import { Card } from "@/components/Card";
import { saveProfile } from "@/lib/store";
import type { Profile, ZoneCorrection } from "@/lib/types";
import type { ZoneDriver } from "@/lib/zone";

/**
 * "I'm actually okay" — shown ONLY in amber (never red). Recording a correction
 * folds the recent levels into the person's learned baseline so Anchor stops
 * nagging at this level (less alert fatigue). It never removes the crisis path:
 * the connect/crisis options sit above this, and the engine still forces red on
 * a genuine crisis regardless of any corrections.
 */
export function OkayCorrection({
  profile,
  drivers,
}: {
  profile: Profile;
  drivers: ZoneDriver[];
}) {
  const record = () => {
    const correction: ZoneCorrection = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      zoneAtCorrection: "amber",
      // Affirm the recent levels of every signal as normal-for-me.
      signals: drivers.map((d) => ({ category: d.signal, value: d.recentMean })),
    };
    saveProfile({
      ...profile,
      corrections: [...(profile.corrections ?? []), correction],
    });
    // saveProfile fires the change event → the dashboard re-reads and re-tunes.
  };

  return (
    <Card>
      <h2 className="text-lg font-semibold">Does this not match how you are?</h2>
      <p className="mt-1 text-sm leading-relaxed text-ink-muted">
        If this nudge is a false alarm, tell Anchor. It&rsquo;ll treat this as
        normal for you and stop flagging it at this level, so it learns your real
        normal instead of nagging. Your circle and crisis line stay available
        either way.
      </p>
      <button
        type="button"
        onClick={record}
        className="mt-4 inline-flex min-h-[2.75rem] items-center rounded-pill border border-steady-300 px-5 py-2.5 text-sm font-medium text-steady-700 hover:bg-steady-50"
      >
        I&rsquo;m actually okay
      </button>
    </Card>
  );
}
