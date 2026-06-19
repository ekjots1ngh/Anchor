import { describe, expect, it } from "vitest";
import {
  DEFAULT_ZONE_BASELINE,
  DEFAULT_ZONE_OPTIONS,
  computeZone,
  type SignalKey,
  type ZoneComputation,
} from "@/lib/zone";
import type {
  CheckIn,
  EarlyWarningSign,
  MoodRating,
  SleepQuality,
} from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Fixtures                                                            */
/* ------------------------------------------------------------------ */

const SIGNS: EarlyWarningSign[] = [
  { id: "sleep-less", name: "Sleeping less", category: "sleep", description: "", source: "library" },
  { id: "withdraw", name: "Pulling away", category: "social", description: "", source: "library" },
  { id: "racing", name: "Racing thoughts", category: "thought", description: "", source: "library" },
];

/** Build a check-in. `present` lists the sign ids marked present that day. */
function ci(
  date: string,
  sleep: SleepQuality,
  mood: MoodRating,
  present: string[] = [],
): CheckIn {
  return {
    id: date,
    createdAt: new Date(date).toISOString(),
    sleep,
    mood,
    answers: present.map((signId) => ({ signId, present: true })),
  };
}

const driver = (result: ZoneComputation, key: SignalKey) =>
  result.drivers.find((d) => d.signal === key)!;

/* ------------------------------------------------------------------ */
/* Intent: sleep & social are weighted the most heavily                */
/* ------------------------------------------------------------------ */

describe("weighting", () => {
  it("weights sleep and social withdrawal the heaviest", () => {
    const w = DEFAULT_ZONE_OPTIONS.weights;
    expect(w.sleep).toBe(3);
    expect(w.social).toBe(3);
    // Strictly heavier than every other signal.
    for (const key of ["mood", "thought", "perception", "self-care"] as SignalKey[]) {
      expect(w.sleep).toBeGreaterThan(w[key]);
      expect(w.social).toBeGreaterThan(w[key]);
    }
  });
});

/* ------------------------------------------------------------------ */
/* Case 1 — steady (green)                                             */
/* ------------------------------------------------------------------ */

describe("steady → green", () => {
  it("returns green with zero drift when check-ins sit at baseline", () => {
    const checkIns = [
      ci("2026-06-17", "good", 4),
      ci("2026-06-18", "good", 5),
      ci("2026-06-19", "good", 4),
    ];
    const result = computeZone({ signs: SIGNS, checkIns, baseline: DEFAULT_ZONE_BASELINE });

    expect(result.zone).toBe("green");
    expect(result.score).toBe(0);
    expect(result.windowSize).toBe(3);
    // Every driver contributed nothing.
    for (const d of result.drivers) {
      expect(d.contribution).toBe(0);
      expect(d.share).toBe(0);
    }
  });

  it("returns green for an empty history (no data, no drift)", () => {
    const result = computeZone({ signs: SIGNS, checkIns: [], baseline: DEFAULT_ZONE_BASELINE });
    expect(result.zone).toBe("green");
    expect(result.score).toBe(0);
    expect(result.windowSize).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/* Case 2 — drifting to amber                                          */
/* ------------------------------------------------------------------ */

describe("drifting → amber", () => {
  // Two days of "okay" sleep, with social withdrawal on the second day.
  const checkIns = [
    ci("2026-06-18", "okay", 4),
    ci("2026-06-19", "okay", 4, ["withdraw"]),
  ];
  const result = computeZone({ signs: SIGNS, checkIns, baseline: DEFAULT_ZONE_BASELINE });

  it("lands in the amber band", () => {
    expect(result.zone).toBe("amber");
    expect(result.score).toBeGreaterThanOrEqual(result.thresholds.amber);
    expect(result.score).toBeLessThan(result.thresholds.red);
    // sleep .5 (both days) + social .5 (avg) over max weight 9.5 → ~0.316.
    expect(result.score).toBeCloseTo(3 / 9.5, 5);
  });

  it("explains itself: sleep and social are the drivers", () => {
    expect(driver(result, "sleep").contribution).toBeCloseTo(1.5, 5);
    expect(driver(result, "social").contribution).toBeCloseTo(1.5, 5);
    expect(driver(result, "mood").contribution).toBe(0);
    expect(driver(result, "thought").contribution).toBe(0);

    // The two drivers each own half of the total push, and shares sum to 1.
    expect(driver(result, "sleep").share).toBeCloseTo(0.5, 5);
    expect(driver(result, "social").share).toBeCloseTo(0.5, 5);
    const shareSum = result.drivers.reduce((s, d) => s + d.share, 0);
    expect(shareSum).toBeCloseTo(1, 5);

    // Drivers are sorted most-influential first.
    expect(["sleep", "social"]).toContain(result.drivers[0].signal);
  });
});

/* ------------------------------------------------------------------ */
/* Case 3 — red                                                        */
/* ------------------------------------------------------------------ */

describe("strong drift → red", () => {
  const checkIns = [ci("2026-06-19", "poor", 1, ["withdraw", "racing"])];
  const result = computeZone({ signs: SIGNS, checkIns, baseline: DEFAULT_ZONE_BASELINE });

  it("crosses the red threshold", () => {
    expect(result.zone).toBe("red");
    expect(result.score).toBeGreaterThanOrEqual(result.thresholds.red);
  });

  it("attributes the decision, led by sleep and social", () => {
    expect(driver(result, "sleep").contribution).toBeCloseTo(3, 5); // poor sleep, full drift
    expect(driver(result, "social").contribution).toBeCloseTo(3, 5); // withdrawal present
    expect(driver(result, "mood").contribution).toBeCloseTo(1.5, 5); // mood 1 → drift .75 × 2
    expect(driver(result, "thought").contribution).toBeCloseTo(1.5, 5);

    // The two heaviest, fully-fired signals lead the explanation.
    expect(result.drivers.slice(0, 2).map((d) => d.signal).sort()).toEqual([
      "sleep",
      "social",
    ]);
  });
});

/* ------------------------------------------------------------------ */
/* Rolling window                                                      */
/* ------------------------------------------------------------------ */

describe("rolling window", () => {
  it("ignores check-ins older than the window", () => {
    const checkIns = [
      ci("2026-06-10", "poor", 1, ["withdraw", "racing"]), // old & bad
      ci("2026-06-18", "good", 5),
      ci("2026-06-19", "good", 4),
    ];
    const result = computeZone({
      signs: SIGNS,
      checkIns,
      baseline: DEFAULT_ZONE_BASELINE,
      options: { windowSize: 2 },
    });
    // Only the two recent, steady days count.
    expect(result.windowSize).toBe(2);
    expect(result.zone).toBe("green");
    expect(result.score).toBe(0);
  });
});
