import { describe, expect, it } from "vitest";
import {
  DEFAULT_ZONE_OPTIONS,
  computeZone,
  type SignalKey,
  type ZoneComputation,
} from "@/lib/zone";
import type { CheckIn, EarlyWarningSign } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Fixtures                                                            */
/* ------------------------------------------------------------------ */

const SLEEP_ONLY: EarlyWarningSign[] = [
  { id: "slp", name: "Sleeping less", category: "sleep", description: "", source: "library" },
];

const SIGNS: EarlyWarningSign[] = [
  { id: "slp", name: "Sleeping less", category: "sleep", description: "", source: "library" },
  { id: "soc1", name: "Pulling away", category: "social", description: "", source: "library" },
  { id: "soc2", name: "Not replying", category: "social", description: "", source: "library" },
  { id: "tho", name: "Racing thoughts", category: "thought", description: "", source: "library" },
];

type SleepQ = CheckIn["sleep"];

/** A check-in `dayIndex` days ago. `present` lists sign ids marked present. */
function day(
  dayIndex: number,
  sleep: SleepQ,
  mood: CheckIn["mood"],
  present: string[] = [],
): CheckIn {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - dayIndex);
  return {
    id: `c${dayIndex}`,
    createdAt: d.toISOString(),
    sleep,
    mood,
    answers: present.map((signId) => ({ signId, present: true })),
  };
}

const driver = (r: ZoneComputation, key: SignalKey) =>
  r.drivers.find((d) => d.signal === key)!;

/** Build N steady days then a list of "recent" days, all in chronological order. */
function series(steady: number, recent: CheckIn[]): CheckIn[] {
  const offset = recent.length;
  const steadyDays = Array.from({ length: steady }, (_, k) =>
    day(steady + offset - 1 - k, "good", 4),
  );
  return [...steadyDays, ...recent];
}

/* ------------------------------------------------------------------ */
/* Intent                                                              */
/* ------------------------------------------------------------------ */

describe("weighting", () => {
  it("weights sleep and social withdrawal the heaviest", () => {
    const w = DEFAULT_ZONE_OPTIONS.weights;
    expect(w.sleep).toBe(3);
    expect(w.social).toBe(3);
    for (const k of ["mood", "thought", "perception", "self-care"] as SignalKey[]) {
      expect(w.sleep).toBeGreaterThan(w[k]);
    }
  });
});

/* ------------------------------------------------------------------ */
/* Steady → green                                                      */
/* ------------------------------------------------------------------ */

describe("steady history → green", () => {
  it("reads green with no drift once a baseline is learned", () => {
    const checkIns = series(12, []); // 12 calm days, nothing recent special
    const r = computeZone({ signs: SIGNS, checkIns });
    expect(r.zone).toBe("green");
    expect(r.score).toBe(0);
    expect(r.baselineReady).toBe(true);
    expect(r.warmingUp).toBe(false);
    for (const d of r.drivers) expect(d.drove).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* Moderate, sustained shift → amber (with transparency)               */
/* ------------------------------------------------------------------ */

describe("a moderate sustained shift → amber", () => {
  // 8 calm days, then 4 days of slightly-worse sleep + some withdrawal.
  const recent = [3, 2, 1, 0].map((n) => day(n, "okay", 4, ["soc1"]));
  const r = computeZone({ signs: SIGNS, checkIns: series(8, recent) });

  it("lands in the amber band", () => {
    expect(r.zone).toBe("amber");
    expect(r.score).toBeGreaterThanOrEqual(r.thresholds.amber);
    expect(r.score).toBeLessThan(r.thresholds.red);
  });

  it("attributes it to sleep and social — sustained, ~1σ above the person's usual", () => {
    const sleep = driver(r, "sleep");
    expect(sleep.drove).toBe(true);
    expect(sleep.fired).toBe(true); // the CUSUM change-point detector fired
    expect(sleep.baselineMean).toBeCloseTo(0, 5); // learned baseline = "well"
    expect(sleep.recentMean).toBeCloseTo(0.5, 5);
    expect(sleep.z).toBeCloseTo(1.0, 5); // one of the person's own sigmas above

    const social = driver(r, "social");
    expect(social.drove).toBe(true);
    expect(social.recentMean).toBeCloseTo(0.5, 5); // one of two social signs

    expect(driver(r, "mood").drove).toBe(false);
    expect(driver(r, "thought").drove).toBe(false);

    // Shares are reported and sum to 1 across the drivers.
    expect(r.drivers.reduce((s, d) => s + d.share, 0)).toBeCloseTo(1, 5);
  });
});

/* ------------------------------------------------------------------ */
/* Large, multi-signal sustained shift → red                           */
/* ------------------------------------------------------------------ */

describe("a large sustained shift across several signs → red", () => {
  it("crosses the red threshold", () => {
    const recent = [3, 2, 1, 0].map((n) =>
      day(n, "poor", 1, ["slp", "soc1", "soc2", "tho"]),
    );
    const r = computeZone({ signs: SIGNS, checkIns: series(8, recent) });
    expect(r.zone).toBe("red");
    expect(r.score).toBeGreaterThanOrEqual(r.thresholds.red);
    expect(driver(r, "sleep").drove).toBe(true);
    expect(driver(r, "social").drove).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* Single-day noise is resisted (the CUSUM point)                      */
/* ------------------------------------------------------------------ */

describe("resists single-day noise", () => {
  it("does not flag one bad day against a steady history", () => {
    // recent window = [calm, calm, calm, one very bad day]
    const recent = [
      day(3, "good", 4),
      day(2, "good", 4),
      day(1, "good", 4),
      day(0, "poor", 1, ["slp", "soc1", "soc2", "tho"]),
    ];
    const r = computeZone({ signs: SIGNS, checkIns: series(8, recent) });

    expect(r.zone).toBe("green");
    const sleep = driver(r, "sleep");
    expect(sleep.recentMean).toBeGreaterThan(0); // it did rise…
    expect(sleep.fired).toBe(false); // …but not as a sustained change-point
    expect(sleep.drove).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* Personalisation: adapts to the individual                           */
/* ------------------------------------------------------------------ */

describe("learns each person's own baseline", () => {
  const recentPoor = [3, 2, 1, 0].map((n) => day(n, "poor", 4));

  it("does NOT flag a chronically-poor sleeper for being themselves", () => {
    // baseline already poor → recent poor is normal for them.
    const steadyPoor = [11, 10, 9, 8, 7, 6, 5, 4].map((n) => day(n, "poor", 4));
    const r = computeZone({
      signs: SLEEP_ONLY,
      checkIns: [...steadyPoor, ...recentPoor],
    });
    expect(r.zone).toBe("green");
    expect(driver(r, "sleep").z).toBeCloseTo(0, 5);
    expect(driver(r, "sleep").drove).toBe(false);
  });

  it("DOES flag the same poor sleep for someone whose baseline is good", () => {
    const r = computeZone({ signs: SLEEP_ONLY, checkIns: series(8, recentPoor) });
    expect(r.zone).not.toBe("green");
    expect(driver(r, "sleep").drove).toBe(true);
    expect(driver(r, "sleep").z).toBeGreaterThan(1);
  });
});

/* ------------------------------------------------------------------ */
/* Cold start: still learning                                          */
/* ------------------------------------------------------------------ */

describe("warming up", () => {
  it("won't flag drift before it has learned a baseline", () => {
    // Only 3 check-ins — not enough baseline, even though they look bad.
    const checkIns = [2, 1, 0].map((n) => day(n, "poor", 1, ["slp"]));
    const r = computeZone({ signs: SLEEP_ONLY, checkIns });
    expect(r.warmingUp).toBe(true);
    expect(r.baselineReady).toBe(false);
    expect(r.zone).toBe("green");
    expect(driver(r, "sleep").drove).toBe(false);
  });
});
