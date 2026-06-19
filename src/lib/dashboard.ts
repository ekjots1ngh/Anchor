import type { Profile, ZoneId } from "@/lib/types";
import {
  computeZone,
  DEFAULT_ZONE_BASELINE,
  type ZoneComputation,
} from "@/lib/zone";

/**
 * Presentation helpers for the dashboard. Everything here is deterministic and
 * template-based — NO LLM. It only turns the zone engine's output into calm,
 * specific copy and a per-day trend.
 */

/** Local YYYY-M-D key so "a day" means the person's day, not UTC. */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export interface TrendDay {
  date: Date;
  weekday: string; // single letter
  isToday: boolean;
  /** null when there was no check-in that day. */
  zone: ZoneId | null;
  score: number;
}

/**
 * The last 7 days, each given a standalone reading from the zone engine
 * (a one-day window) so the row reads as a day-to-day trajectory.
 */
export function buildTrend(profile: Profile, today = new Date()): TrendDay[] {
  const byDay = new Map(profile.checkIns.map((c) => [dayKey(new Date(c.createdAt)), c]));
  const todayKey = dayKey(today);
  const days: TrendDay[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const checkIn = byDay.get(dayKey(date));
    let zone: ZoneId | null = null;
    let score = 0;
    if (checkIn) {
      const reading = computeZone({
        signs: profile.signs,
        checkIns: [checkIn],
        baseline: DEFAULT_ZONE_BASELINE,
        options: { windowSize: 1 },
      });
      zone = reading.zone;
      score = reading.score;
    }
    days.push({
      date,
      weekday: date.toLocaleDateString(undefined, { weekday: "short" }).charAt(0),
      isToday: dayKey(date) === todayKey,
      zone,
      score,
    });
  }
  return days;
}

export interface StatusCopy {
  headline: string;
  body: string;
}

const joinNames = (names: string[]): string =>
  names.length <= 1
    ? names.join("")
    : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

/**
 * Calm, specific status copy derived from the engine result. Green reassures;
 * amber is gentle and names what drifted; red is warm but clear about support.
 */
export function statusCopy(
  result: ZoneComputation,
  zoneLabel: string,
  firstName?: string,
): StatusCopy {
  const who = firstName ? `, ${firstName}` : "";
  const movers = result.drivers.filter((d) => d.drift > 0).map((d) => d.label);

  if (result.zone === "green") {
    return {
      headline: `You're ${zoneLabel.toLowerCase()}${who}.`,
      body:
        "Nothing's drifting from your baseline right now. This is just your own picture, reflected back — keep leaning on what works for you.",
    };
  }

  if (result.zone === "amber") {
    const named = movers.slice(0, 2);
    const detail = named.length ? ` — mostly ${joinNames(named)}` : "";
    return {
      headline: `A few signs have drifted a little${who}.`,
      body: `Some things have nudged away from your baseline this week${detail}. Nothing's wrong — it might just be a good moment to slow down and lean on what helps.`,
    };
  }

  const named = movers.slice(0, 3);
  const detail = named.length ? `, including ${joinNames(named)}` : "";
  return {
    headline: "Quite a lot has drifted from your baseline.",
    body: `Several of your signals have moved away from steady${detail}. This is the kind of moment you told us you'd want real support — your circle and crisis line are right here.`,
  };
}

/** A gentle, non-clinical status word for a single watched signal. */
export function signalStatus(drift: number): {
  label: string;
  pill: string;
  bar: string;
} {
  if (drift <= 0) {
    return { label: "Steady", pill: "bg-steady-100 text-steady-700", bar: "bg-steady-300" };
  }
  if (drift < 0.5) {
    return { label: "A little", pill: "bg-checkin-100 text-checkin-700", bar: "bg-checkin-300" };
  }
  return { label: "Showing", pill: "bg-crisis-100 text-crisis-700", bar: "bg-crisis-300" };
}

/** Soft bar colour for a trend day. */
export function trendBar(zone: ZoneId | null): string {
  if (zone === "red") return "bg-crisis-300";
  if (zone === "amber") return "bg-checkin-300";
  if (zone === "green") return "bg-steady-300";
  return "bg-line"; // no check-in that day
}

export function zoneRank(zone: ZoneId): number {
  return zone === "green" ? 0 : zone === "amber" ? 1 : 2;
}
