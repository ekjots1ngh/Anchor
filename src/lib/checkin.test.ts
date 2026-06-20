import { describe, expect, it } from "vitest";
import { QUICK_CHECKIN_AFTER, stableStreak, steadyState } from "@/lib/checkin";
import { createEmptyProfile } from "@/lib/store";
import type { CheckIn, Profile } from "@/lib/types";

function day(n: number, opts: Partial<CheckIn> = {}): CheckIn {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return {
    id: `c${n}`,
    createdAt: d.toISOString(),
    sleep: "good",
    mood: 4,
    answers: [],
    ...opts,
  };
}

function profileWith(checkIns: CheckIn[]): Profile {
  const p = createEmptyProfile();
  p.onboardedAt = new Date().toISOString();
  p.signs = [
    { id: "slp", name: "Sleeping less", category: "sleep", description: "", source: "library" },
  ];
  p.checkIns = checkIns;
  return p;
}

describe("stableStreak", () => {
  it("counts trailing clean days and stops at the first rough one", () => {
    const checkIns = [
      day(5, { sleep: "poor", answers: [{ signId: "slp", present: true }] }),
      day(4),
      day(3),
      day(2),
      day(1),
      day(0),
    ];
    expect(stableStreak(checkIns)).toBe(5); // the 5 recent clean days
  });

  it("resets to zero when the most recent day shows a sign", () => {
    const checkIns = [day(2), day(1), day(0, { answers: [{ signId: "slp", present: true }] })];
    expect(stableStreak(checkIns)).toBe(0);
  });
});

describe("steadyState", () => {
  it("offers the quick check-in only after a steady streak", () => {
    const longSteady = profileWith(
      Array.from({ length: 10 }, (_, k) => day(9 - k)),
    );
    const s = steadyState(longSteady);
    expect(s.streak).toBeGreaterThanOrEqual(QUICK_CHECKIN_AFTER);
    expect(s.quick).toBe(true);
  });

  it("stays on the full check-in while warming up (too little history)", () => {
    const fresh = profileWith([day(1), day(0)]);
    expect(steadyState(fresh).quick).toBe(false);
  });

  it("reverts to the full check-in the moment a recent day is rough", () => {
    const checkIns = Array.from({ length: 10 }, (_, k) => day(9 - k));
    checkIns[checkIns.length - 1] = day(0, {
      sleep: "poor",
      answers: [{ signId: "slp", present: true }],
    });
    expect(steadyState(profileWith(checkIns)).quick).toBe(false);
  });
});
