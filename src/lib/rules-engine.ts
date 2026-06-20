import type {
  Baseline,
  CheckIn,
  EarlyWarningSign,
  ZoneId,
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
 *     is involved in deciding the zone. Given the same inputs, this function
 *     returns the same zone, forever.
 *   - An LLM is permitted to rephrase the human-facing `message` string
 *     (see phraseMessage in src/lib/messaging.ts) and NOTHING else.
 *
 * The rule is intentionally simple enough to read aloud: count how many of
 * the person's own early-warning signs are present today. Compare that count
 * against the two thresholds the person set while well (baseline.amberAt and
 * baseline.redAt). At or above redAt → red. Else at or above amberAt → amber.
 * Otherwise → green. That's the whole rule.
 */

export interface EvaluateInput {
  signs: EarlyWarningSign[];
  checkIn: CheckIn;
  baseline: Baseline;
}

/** Pure function. Same inputs → same output. No side effects, no I/O. */
export function evaluateZone({
  signs,
  checkIn,
  baseline,
}: EvaluateInput): ZoneResult {
  const presentBySign = new Map(
    checkIn.answers.map((a) => [a.signId, a.present]),
  );

  const reasons: ZoneReason[] = signs.map((sign) => ({
    signId: sign.id,
    signName: sign.name,
    present: presentBySign.get(sign.id) ?? false,
  }));

  const presentCount = reasons.filter((r) => r.present).length;

  const zone: ZoneId =
    presentCount >= baseline.redAt
      ? "red"
      : presentCount >= baseline.amberAt
        ? "amber"
        : "green";

  return {
    zone,
    presentCount,
    baseline,
    reasons,
    // Deterministic default message. An LLM may later rephrase this string
    // only (see src/lib/messaging.ts) — it can never change `zone`.
    message: defaultMessage(zone, reasons),
  };
}

/**
 * Plain, template-based message. No model involved. This is the baseline the
 * product ships with; the optional LLM layer only ever rewrites the wording
 * to feel warmer, never the meaning.
 */
function defaultMessage(zone: ZoneId, reasons: ZoneReason[]): string {
  if (zone === "green") {
    return "Things look steady today. Nothing here needs action. This is just your own picture, reflected back.";
  }

  const present = reasons.filter((r) => r.present).map((r) => r.signName);
  const list =
    present.length === 1
      ? present[0]
      : `${present.slice(0, -1).join(", ")} and ${present[present.length - 1]}`;

  if (zone === "amber") {
    return `A few of the signs you chose to watch for are showing right now (${list}). That doesn't mean anything is wrong. It might just be worth a check-in, and reaching out to someone in your circle.`;
  }

  return `Several of your signs are showing at once (${list}). This is the moment you told us you'd want real support. Your plan and the people on it are one tap away.`;
}
