/**
 * Core domain types for Anchor.
 *
 * Anchor is NOT diagnostic. None of these types model a diagnosis, a clinical
 * score, or any judgement about how "unwell" someone is. They model a
 * person's OWN early-warning signs, their OWN words for each zone, and their
 * OWN plan for staying well and reaching real human support.
 *
 * Everything here is authored by the person (ideally alongside their care
 * team) while they are well. Anchor only ever mirrors it back.
 */

/* ------------------------------------------------------------------ */
/* Zones                                                               */
/* ------------------------------------------------------------------ */

/**
 * The three zones. These are SEMANTIC ids only. Their colour treatment is
 * deliberately calm — "red" is a muted clay, never an alarm colour
 * (see src/design/tokens.ts and the README). Anchor never shouts at a
 * person about their own mental health.
 */
export type ZoneId = "green" | "amber" | "red";

/**
 * A zone, in the PERSON'S OWN WORDS. During onboarding the person names and
 * describes what green / amber / red feel like for them — Anchor does not
 * impose language like "relapse" or "crisis" on anyone.
 */
export interface Zone {
  id: ZoneId;
  /** The person's own short name for this zone, e.g. "Anchored", "Wobbly". */
  label: string;
  /** The person's own description of what this zone feels like for them. */
  description: string;
}

/* ------------------------------------------------------------------ */
/* Early-warning signs                                                 */
/* ------------------------------------------------------------------ */

/**
 * Loose grouping so signs can be shown in gentle, relatable clusters during
 * onboarding. Not a clinical taxonomy.
 */
export type SignCategory =
  | "sleep"
  | "social"
  | "thought"
  | "mood"
  | "perception"
  | "self-care";

export const SIGN_CATEGORY_LABELS: Record<SignCategory, string> = {
  sleep: "Sleep & energy",
  social: "People & connection",
  thought: "Thinking & focus",
  mood: "Mood & feelings",
  perception: "Senses & perception",
  "self-care": "Daily routine & self-care",
};

/**
 * An early-warning sign the person has chosen to watch for. Either picked
 * from the starter library or written from scratch. The `description` is
 * always in the person's OWN words — that's the point.
 */
export interface EarlyWarningSign {
  id: string;
  /** Short name, e.g. "Sleeping less". */
  name: string;
  category: SignCategory;
  /** The person's own description of how this shows up for them. */
  description: string;
  /** Where it came from — a starter suggestion or something they added. */
  source: "library" | "custom";
}

/* ------------------------------------------------------------------ */
/* Baseline                                                            */
/* ------------------------------------------------------------------ */

/**
 * "What well looks like for me", plus the transparent, inspectable
 * thresholds the rules engine uses. These thresholds are simply: how many
 * of my early-warning signs showing at once nudges me from green into amber,
 * and from amber into red. The person sets these while well — never an LLM.
 */
export interface Baseline {
  /** The person's own description of their steady, well self. */
  description: string;
  /** Number of signs present that tips green → amber. */
  amberAt: number;
  /** Number of signs present that tips amber → red. */
  redAt: number;
}

/* ------------------------------------------------------------------ */
/* Staying-well actions                                                */
/* ------------------------------------------------------------------ */

/**
 * Something the person knows helps them stay or get steady. Their words.
 * Optionally tied to the zone where it's most useful.
 */
export interface StayingWellAction {
  id: string;
  text: string;
  /** The zone this action is most for, if the person wants to tie it to one. */
  forZone?: ZoneId;
}

/* ------------------------------------------------------------------ */
/* Trusted circle & crisis plan                                        */
/* ------------------------------------------------------------------ */

/**
 * A real human in the person's trusted circle. `alertAtZone` is the zone at
 * which the person would want this contact looped in. `consent` records that
 * the person has confirmed this contact has agreed to be part of the circle —
 * Anchor never adds someone silently.
 */
export interface TrustedContact {
  id: string;
  name: string;
  relationship: string;
  phone?: string;
  /** From which zone onward this person should be reached. */
  alertAtZone: ZoneId;
  /** The contact has agreed to be part of the trusted circle. */
  consent: boolean;
}

/**
 * The crisis plan. A real crisis line plus the person's own wishes for what
 * helps and what to avoid if things reach the red zone.
 */
export interface CrisisPlan {
  crisisLineName: string;
  crisisLinePhone: string;
  /** What the person finds helpful in a crisis, in their words. */
  whatHelps?: string;
  /** What the person wants others to avoid in a crisis, in their words. */
  whatToAvoid?: string;
  /** Anything else — a safe place to go, who to call first, etc. */
  notes?: string;
}

/* ------------------------------------------------------------------ */
/* Check-ins (used by the rules engine)                                */
/* ------------------------------------------------------------------ */

export interface CheckInAnswer {
  signId: string;
  present: boolean;
  note?: string;
}

/** How the person slept — a quick three-way, not a sleep diary. */
export type SleepQuality = "good" | "okay" | "poor";

/** Mood on a gentle 1–5 scale (1 = very low, 5 = very good). */
export type MoodRating = 1 | 2 | 3 | 4 | 5;

/**
 * One daily check-in. Designed to take ~30 seconds: how you slept, a mood
 * number, and a quick yes/no on your own early-warning signs. Sleep and mood
 * are recorded for the person's own reflection/trends — the ZONE itself still
 * comes only from the signs, via the rules engine.
 */
export interface CheckIn {
  id: string;
  createdAt: string; // ISO timestamp
  sleep: SleepQuality;
  mood: MoodRating;
  answers: CheckInAnswer[];
}

/* ------------------------------------------------------------------ */
/* The full profile                                                    */
/* ------------------------------------------------------------------ */

/**
 * Everything the person owns. Held in the local store (src/lib/store.ts).
 * The person can read, export, or erase all of it at any time.
 */
export interface Profile {
  id: string;
  displayName: string;
  createdAt: string;
  /** Set when onboarding is completed; null while in progress. */
  onboardedAt: string | null;
  signs: EarlyWarningSign[];
  /** The three zones, in the person's own words. */
  zones: Record<ZoneId, Zone>;
  baseline: Baseline;
  stayingWellActions: StayingWellAction[];
  trustedContacts: TrustedContact[];
  crisisPlan: CrisisPlan;
  checkIns: CheckIn[];
}

/* ------------------------------------------------------------------ */
/* Rules-engine output                                                 */
/* ------------------------------------------------------------------ */

/**
 * The transparent output of the rules engine. The `zone` and the `reasons`
 * come ENTIRELY from deterministic rules. The `message` is the ONLY field an
 * LLM may ever touch — and only to rephrase, never to decide.
 */
export interface ZoneResult {
  zone: ZoneId;
  /** How many early-warning signs were present in this check-in. */
  presentCount: number;
  baseline: Baseline;
  reasons: ZoneReason[];
  message: string;
}

export interface ZoneReason {
  signId: string;
  signName: string;
  present: boolean;
}
