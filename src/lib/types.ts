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
 * The five staying-well domains, grounded in established relapse-prevention and
 * early-warning-signs frameworks (e.g. WRAP — Wellness Recovery Action Plan, and
 * relapse early-signs work). A gentle grouping for the person, not a clinical
 * taxonomy or diagnostic instrument.
 */
export type SignCategory =
  | "sleep"
  | "social"
  | "thinking"
  | "function"
  | "mood";

export const SIGN_CATEGORY_LABELS: Record<SignCategory, string> = {
  sleep: "Sleep & energy",
  social: "People & connection",
  thinking: "Thinking & perception",
  function: "Everyday function",
  mood: "Mood & feelings",
};

/** One-line, plain descriptions shown under each domain heading. */
export const SIGN_CATEGORY_BLURBS: Record<SignCategory, string> = {
  sleep: "How you're sleeping and your energy.",
  social: "How connected you feel to other people.",
  thinking: "How your thoughts feel, and how you're making sense of things.",
  function: "Keeping up with everyday basics and routine.",
  mood: "How you've been feeling in yourself.",
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
 * How much a trusted contact is allowed to see about the person. This is a
 * data-sovereignty control: it decides exactly what a pre-filled message ever
 * reveals to that contact — nothing more is shared, and only when the person
 * chooses to send it.
 */
export type ContactVisibility = "nudge" | "zone" | "signals";

export const CONTACT_VISIBILITY_LABELS: Record<ContactVisibility, string> = {
  nudge: "Only that I'd like to talk",
  zone: "That, plus how I'm doing (my zone)",
  signals: "That, plus which signs are showing",
};

/**
 * A real human in the person's trusted circle. `alertAtZone` is the zone at
 * which the person would want this contact looped in. `consent` records that
 * the person has confirmed this contact has agreed to be part of the circle —
 * Anchor never adds someone silently. `visibility` is what they're allowed to
 * see (defaults to the most private, "nudge").
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
  /** What this contact is allowed to see. */
  visibility: ContactVisibility;
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
/* Corrections ("I'm actually okay")                                   */
/* ------------------------------------------------------------------ */

/**
 * A recorded "I'm actually okay" correction. When the person dismisses an amber
 * nudge as a false alarm, Anchor stores the recent per-signal levels they
 * affirmed as normal and folds them GENTLY into their learned baseline — so it
 * adapts to their real normal and stops nagging at that level (less alert
 * fatigue).
 *
 * Corrections can only ever RELAX an amber reading. They never suppress a
 * genuine red: the engine re-checks the person's raw history and forces red
 * regardless of any corrections, and the crisis routing is always available.
 */
export interface ZoneCorrection {
  id: string;
  createdAt: string; // ISO timestamp
  /** The zone shown when the person said they were okay (always amber). */
  zoneAtCorrection: ZoneId;
  /** The recent per-signal levels (0..1) the person affirmed as normal. */
  signals: { category: SignCategory; value: number }[];
}

/* ------------------------------------------------------------------ */
/* Supporter access (consent-gated, read-only sharing)                 */
/* ------------------------------------------------------------------ */

/**
 * Optional, consent-gated supporter access. The person can let a family member
 * or care coordinator see a READ-ONLY summary — zone history and trends only,
 * never raw private notes. Off by default. The person turns it on, chooses what
 * a supporter sees, and can revoke at any time — revoking rotates the `token`
 * so any link already shared stops working.
 */
export interface SharingSettings {
  enabled: boolean;
  /** Who the person is sharing with, in their words (e.g. "Mum"). */
  supporterName: string;
  /** Their role (e.g. "Family", "Care coordinator"). */
  supporterRole: string;
  /** Opaque token in the supporter link; rotated on every grant/revoke. */
  token: string;
  /** Include the zone-history trend (vs current zone only). */
  includeTrends: boolean;
  /** Include which broad areas are drifting (generic category labels only). */
  includeDriftAreas: boolean;
  grantedAt: string | null;
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
  /**
   * Whether the person set Anchor up alongside someone they trust (a clinician,
   * family member, or friend). Optional and purely informational — it gently
   * personalises tone and is noted on the clinician summary. Never required.
   */
  setupTogether?: boolean;
  /** The three zones, in the person's own words. */
  zones: Record<ZoneId, Zone>;
  baseline: Baseline;
  stayingWellActions: StayingWellAction[];
  trustedContacts: TrustedContact[];
  crisisPlan: CrisisPlan;
  checkIns: CheckIn[];
  /** "I'm actually okay" corrections that gently tune the learned baseline. */
  corrections: ZoneCorrection[];
  /** Consent-gated, read-only supporter access. Off by default. */
  sharing: SharingSettings;
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
