import type { CheckIn, Profile } from "@/lib/types";
import { computeZoneForProfile } from "@/lib/zone";

/**
 * How the daily check-in adapts to keep the burden low.
 *
 * When someone has been steady for a while, asking the full set of questions
 * every day is unnecessary friction. The check-in shortens to a single tap once
 * a stable streak builds up — and reverts to the full check-in the moment
 * anything looks off, so it never quietly stops paying attention.
 */

/** Number of trailing days the person was clean (no signs, decent sleep/mood). */
export function stableStreak(checkIns: CheckIn[]): number {
  const sorted = [...checkIns].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
  let streak = 0;
  for (const c of sorted) {
    const noSigns = !c.answers.some((a) => a.present);
    const clean = noSigns && c.sleep !== "poor" && c.mood >= 3;
    if (clean) streak += 1;
    else break;
  }
  return streak;
}

/** Days of clean streak before the quick (one-tap) check-in is offered. */
export const QUICK_CHECKIN_AFTER = 3;

export interface SteadyState {
  /** Offer the short, one-tap check-in. */
  quick: boolean;
  streak: number;
}

/**
 * The check-in is allowed to shorten only when things are genuinely steady:
 * the engine currently reads green, it has learned a baseline (not warming up),
 * and there's a clean streak of at least QUICK_CHECKIN_AFTER days.
 */
export function steadyState(profile: Profile): SteadyState {
  const streak = stableStreak(profile.checkIns);
  const zone = computeZoneForProfile(profile);
  const quick =
    zone.zone === "green" && !zone.warmingUp && streak >= QUICK_CHECKIN_AFTER;
  return { quick, streak };
}
