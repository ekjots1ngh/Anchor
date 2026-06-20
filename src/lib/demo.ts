import type { CheckIn, Profile } from "@/lib/types";
import { DEFAULT_ZONE_WORDS } from "@/lib/starter-library";

/**
 * Demo-mode data (dev/stage only).
 *
 * The drift engine learns a personal baseline, so the demo first establishes a
 * steady history, then injects a *moderate, sustained* dip:
 *   - seededProfile()  → 12 calm days → a learned baseline of "well" → green
 *   - dippedProfile()  → 8 calm days + 4 days of slightly-worse sleep and some
 *                        social withdrawal → a sustained ~1σ shift on the two
 *                        heavily-weighted signals → tips to amber (not red,
 *                        which a full-blown swing would trigger).
 *
 * The profile carries a sleep sign and two social signs, so the dip can be a
 * partial (~half) withdrawal rather than an all-or-nothing one.
 */

function daysAgo(n: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

const SLEEP_SIGN = "demo-sleep";
const SOCIAL_SIGN_A = "demo-social-a";
const SOCIAL_SIGN_B = "demo-social-b";

function steadyDay(n: number): CheckIn {
  return {
    id: `demo-steady-${n}`,
    createdAt: daysAgo(n),
    sleep: "good",
    mood: 4,
    answers: [
      { signId: SLEEP_SIGN, present: false },
      { signId: SOCIAL_SIGN_A, present: false },
      { signId: SOCIAL_SIGN_B, present: false },
    ],
  };
}

function dipDay(n: number): CheckIn {
  return {
    id: `demo-dip-${n}`,
    createdAt: daysAgo(n),
    // Moderately worse than baseline: "okay" sleep and one of two social signs.
    sleep: "okay",
    mood: 4,
    answers: [
      { signId: SLEEP_SIGN, present: false },
      { signId: SOCIAL_SIGN_A, present: true },
      { signId: SOCIAL_SIGN_B, present: false },
    ],
  };
}

function baseProfile(): Profile {
  return {
    id: "demo",
    displayName: "Alex",
    createdAt: daysAgo(30),
    onboardedAt: daysAgo(30),
    signs: [
      {
        id: SLEEP_SIGN,
        name: "Sleeping less",
        category: "sleep",
        description: "I'm getting fewer hours and waking through the night.",
        source: "library",
      },
      {
        id: SOCIAL_SIGN_A,
        name: "Pulling away from people",
        category: "social",
        description: "I start cancelling plans and going quiet.",
        source: "library",
      },
      {
        id: SOCIAL_SIGN_B,
        name: "Not replying to messages",
        category: "social",
        description: "I leave texts unread for days.",
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
        visibility: "signals",
      },
    ],
    crisisPlan: {
      crisisLineName: "Samaritans",
      crisisLinePhone: "116 123",
    },
    checkIns: [],
    corrections: [],
  };
}

/** 12 steady days → a learned baseline of "well" → green. */
export function seededProfile(): Profile {
  const days = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
  return { ...baseProfile(), checkIns: days.map(steadyDay) };
}

/** 8 steady days + 4 moderately-dipping days → tips to amber. */
export function dippedProfile(): Profile {
  return {
    ...baseProfile(),
    checkIns: [
      ...[11, 10, 9, 8, 7, 6, 5, 4].map(steadyDay),
      ...[3, 2, 1, 0].map(dipDay),
    ],
  };
}
