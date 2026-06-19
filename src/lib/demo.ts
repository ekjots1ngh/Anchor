import type { CheckIn, Profile } from "@/lib/types";
import { DEFAULT_ZONE_WORDS } from "@/lib/starter-library";

/**
 * Demo-mode data (dev/stage only).
 *
 * Produces a deterministic profile so a presenter can show the dashboard sitting
 * steady (green), then tip it to amber on cue:
 *   - seededProfile()  → 7 calm days, every signal at baseline → green
 *   - dippedProfile()  → 4 calm days + 3 days of dipping sleep + social
 *                        withdrawal → the 7-day window tips to amber (~0.32,
 *                        comfortably between the 0.25 amber and 0.5 red lines)
 *
 * The profile carries only a sleep sign and a social sign, so the zone engine's
 * heavily-weighted Sleep and Social signals are exactly what drives the tip —
 * which is also what the LLM note names.
 */

/** ISO timestamp for N days ago, pinned to local noon to avoid TZ edges. */
function daysAgo(n: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

const SLEEP_SIGN = "demo-sleep";
const SOCIAL_SIGN = "demo-social";

function steadyDay(n: number): CheckIn {
  return {
    id: `demo-steady-${n}`,
    createdAt: daysAgo(n),
    sleep: "good",
    mood: 4,
    answers: [
      { signId: SLEEP_SIGN, present: false },
      { signId: SOCIAL_SIGN, present: false },
    ],
  };
}

function dipDay(n: number): CheckIn {
  return {
    id: `demo-dip-${n}`,
    createdAt: daysAgo(n),
    sleep: "poor",
    mood: 4,
    answers: [
      { signId: SLEEP_SIGN, present: true },
      { signId: SOCIAL_SIGN, present: true },
    ],
  };
}

/** Everything except the check-ins — identical across seed and dip. */
function baseProfile(): Profile {
  return {
    id: "demo",
    displayName: "Alex",
    createdAt: daysAgo(14),
    onboardedAt: daysAgo(14),
    signs: [
      {
        id: SLEEP_SIGN,
        name: "Sleeping less",
        category: "sleep",
        description: "I'm getting fewer hours and waking through the night.",
        source: "library",
      },
      {
        id: SOCIAL_SIGN,
        name: "Pulling away from people",
        category: "social",
        description: "I leave messages unread and start cancelling plans.",
        source: "library",
      },
    ],
    zones: {
      green: { id: "green", ...DEFAULT_ZONE_WORDS.green },
      amber: { id: "amber", ...DEFAULT_ZONE_WORDS.amber },
      red: { id: "red", ...DEFAULT_ZONE_WORDS.red },
    },
    baseline: {
      description: "When I'm well I sleep through and stay in touch with people.",
      amberAt: 2,
      redAt: 4,
    },
    stayingWellActions: [
      { id: "demo-a1", text: "Get to bed before midnight" },
      { id: "demo-a2", text: "Text Sam before things build up" },
      { id: "demo-a3", text: "A short walk outside, even ten minutes" },
    ],
    trustedContacts: [
      {
        id: "demo-sam",
        name: "Sam Rivera",
        relationship: "Close friend",
        phone: "07700 900123",
        alertAtZone: "amber",
        consent: true,
      },
    ],
    crisisPlan: {
      crisisLineName: "Samaritans",
      crisisLinePhone: "116 123",
    },
    checkIns: [],
  };
}

/** 7 steady days → green. */
export function seededProfile(): Profile {
  return {
    ...baseProfile(),
    checkIns: [6, 5, 4, 3, 2, 1, 0].map(steadyDay),
  };
}

/** 4 steady days + 3 dipping days → tips the 7-day window to amber. */
export function dippedProfile(): Profile {
  return {
    ...baseProfile(),
    checkIns: [
      ...[6, 5, 4, 3].map(steadyDay),
      ...[2, 1, 0].map(dipDay),
    ],
  };
}
