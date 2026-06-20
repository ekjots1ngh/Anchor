import { describe, expect, it } from "vitest";
import { dippedProfile, seededProfile } from "@/lib/demo";
import { computeZoneForProfile } from "@/lib/zone";

/**
 * Stage safety net: the demo must reliably show green, then tip to amber
 * (never green-that-won't-move, never overshooting to red).
 */
describe("demo mode", () => {
  it("seeds a steady week that reads green", () => {
    const result = computeZoneForProfile(seededProfile());
    expect(result.zone).toBe("green");
    expect(result.score).toBe(0);
  });

  it("tips to amber — not still green, not red — when the dip is injected", () => {
    const result = computeZoneForProfile(dippedProfile());
    expect(result.zone).toBe("amber");
    expect(result.score).toBeGreaterThanOrEqual(result.thresholds.amber);
    expect(result.score).toBeLessThan(result.thresholds.red);
  });

  it("tips on sleep and social withdrawal — what the warm note will name", () => {
    const result = computeZoneForProfile(dippedProfile());
    const movers = result.drivers
      .filter((d) => d.drift > 0)
      .map((d) => d.signal)
      .sort();
    expect(movers).toEqual(["sleep", "social"]);
  });
});
