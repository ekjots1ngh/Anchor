import type {
  CheckIn,
  EarlyWarningSign,
  StayingWellPlan,
  ZoneReason,
  ZoneResult,
} from "@/lib/types";

/**
 * ANCHOR RULES ENGINE
 * ===================
 *
 * This file, and ONLY this file, decides which zone a check-in falls into.
 *
 * Non-negotiable architectural rule:
 *   - The zone decision is 100% deterministic and inspectable.
 *   - NO large language model, no probabilistic model, and no network call
 *     is involved in deciding the zone. Given the same inputs, this
 *     function returns the same zone, forever.
 *   - An LLM is permitted to rephrase the human-facing `message` string
 *     (see phraseMessage in src/lib/messaging.ts) and NOTHING else.
 *
 * Why this matters: a person's "are my early-warning signs showing?"
 * decision must be transparent, auditable, and owned by the person and
 * their care team — not delegated to a black box.
 *
 * The engine is intentionally simple: each early-warning sign the person
 * defined for themselves carries a weight they agreed to. We sum the
 * weights of the signs present in this check-in. If that sum meets or
 * exceeds the person's agreed threshold, the zone is "worth a check-in".
 * Otherwise it is "steady". That's the whole rule. It can be read in full
 * by the person, by a clinician, or by anyone reviewing the system.
 */

export interface EvaluateInput {
  signs: EarlyWarningSign[];
  checkIn: CheckIn;
  /** The person's agreed threshold, from their staying-well plan. */
  threshold: StayingWellPlan["checkinThreshold"];
}

/**
 * Pure function. Same inputs → same output. No side effects, no I/O.
 */
export function evaluateZone({
  signs,
  checkIn,
  threshold,
}: EvaluateInput): ZoneResult {
  const answerBySign = new Map(
    checkIn.answers.map((a) => [a.signId, a]),
  );

  const reasons: ZoneReason[] = signs.map((sign) => {
    const present = answerBySign.get(sign.id)?.present ?? false;
    const contribution = present ? sign.weight : 0;
    return {
      signId: sign.id,
      signLabel: sign.label,
      present,
      weight: sign.weight,
      contribution,
    };
  });

  const score = reasons.reduce((sum, r) => sum + r.contribution, 0);
  const zone = score >= threshold ? "checkin" : "steady";

  return {
    zone,
    score,
    threshold,
    reasons,
    // Deterministic default message. An LLM may later rephrase this string
    // only (see src/lib/messaging.ts) — it can never change `zone`.
    message: defaultMessage(zone, reasons),
  };
}

/**
 * Plain, template-based message. No model involved. This is the baseline
 * the product ships with; the optional LLM layer only ever rewrites the
 * wording to feel warmer, never the meaning.
 */
function defaultMessage(
  zone: ZoneResult["zone"],
  reasons: ZoneReason[],
): string {
  if (zone === "steady") {
    return "Things look steady today. Nothing here needs action — this is just your own picture, reflected back.";
  }

  const present = reasons.filter((r) => r.present).map((r) => r.signLabel);
  const list =
    present.length === 1
      ? present[0]
      : `${present.slice(0, -1).join(", ")} and ${present[present.length - 1]}`;

  return `A few of the signs you told us to watch for are showing right now (${list}). That doesn't mean anything is wrong — it might just be worth reaching out to someone on your plan.`;
}
