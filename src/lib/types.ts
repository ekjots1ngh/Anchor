import type { Zone } from "@/design/tokens";

/**
 * Core domain types for Anchor.
 *
 * Anchor is NOT diagnostic. None of these types model a diagnosis, a score
 * of "how unwell" someone is, or any clinical judgement. They model a
 * person's OWN pre-agreed early-warning signs and their OWN plan for what
 * to do about them.
 */

export type { Zone };

/**
 * An early-warning sign the person has defined for themselves during
 * onboarding (e.g. "I'm sleeping less than 5 hours", "I'm hearing the
 * radio talk about me"). These are the person's words, not a clinician's
 * checklist.
 */
export interface EarlyWarningSign {
  id: string;
  /** The person's own description of the sign. */
  label: string;
  /**
   * How much weight the person/their care team agreed this sign carries.
   * This is set by people, transparently, during onboarding — never inferred.
   */
  weight: 1 | 2 | 3;
}

/** A single answer in a check-in: was this sign present today? */
export interface CheckInAnswer {
  signId: string;
  present: boolean;
  /** Optional free-text note the person chose to add. */
  note?: string;
}

/** One completed check-in. */
export interface CheckIn {
  id: string;
  createdAt: string; // ISO timestamp
  answers: CheckInAnswer[];
}

/** A real human the person has chosen to reach out to. */
export interface SupportContact {
  id: string;
  name: string;
  /** e.g. "Care coordinator", "Mum", "Crisis line". */
  relationship: string;
  phone?: string;
  notes?: string;
}

/**
 * The person's staying-well plan. Authored WITH their care team, owned by
 * the person. Anchor only ever mirrors this back.
 */
export interface StayingWellPlan {
  /** What helps the person stay steady, in their words. */
  whatHelps: string[];
  /** Who to reach out to, in priority order. */
  contacts: SupportContact[];
  /**
   * The agreed threshold (sum of triggered sign weights) at or above which
   * Anchor surfaces the "worth a check-in" zone. Set by people, inspectable.
   */
  checkinThreshold: number;
}

/** The full per-person profile held in the local store. */
export interface Profile {
  id: string;
  displayName: string;
  signs: EarlyWarningSign[];
  plan: StayingWellPlan;
  checkIns: CheckIn[];
  /** When onboarding was completed. Null until then. */
  onboardedAt: string | null;
}

/**
 * The transparent output of the rules engine. Note that the ZONE and the
 * REASONS come entirely from deterministic rules. The optional `message`
 * is the ONLY field an LLM may ever touch — and only to rephrase, never to
 * decide. See src/lib/rules-engine.ts.
 */
export interface ZoneResult {
  zone: Zone;
  /** Sum of weights of the signs that were present. */
  score: number;
  /** The threshold this score was compared against. */
  threshold: number;
  /** Human-readable, inspectable explanation of every input to the decision. */
  reasons: ZoneReason[];
  /**
   * A warm, plain-language summary. Filled by deterministic templates by
   * default; an LLM may optionally rephrase this string — and ONLY this
   * string — without ever changing `zone`.
   */
  message: string;
}

export interface ZoneReason {
  signId: string;
  signLabel: string;
  present: boolean;
  weight: number;
  /** weight counted toward the score (0 if not present). */
  contribution: number;
}
