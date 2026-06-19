import type { ZoneResult } from "@/lib/types";

/**
 * THE ONLY PLACE AN LLM IS ALLOWED.
 *
 * The rules engine (src/lib/rules-engine.ts) has already decided the zone.
 * That decision is fixed. This module exists to (optionally) make the
 * human-facing wording warmer — and that is ALL it may do.
 *
 * Hard contract, enforced by design:
 *   - Input:  a ZoneResult whose `zone` is already decided.
 *   - Output: a ZoneResult with the SAME `zone`, `score`, `threshold` and
 *             `reasons`; only `message` may differ.
 *
 * Today this is a no-op pass-through (we haven't wired a model yet — this
 * is a scaffold). When an LLM is added later, it goes behind this function
 * and the assertion below guarantees it can never flip the zone.
 */
export async function phraseMessage(
  result: ZoneResult,
): Promise<ZoneResult> {
  // --- LLM call would go here, taking ONLY result.message + tone guidance,
  //     and returning a rephrased string. Not implemented in the scaffold.
  const rephrased = result.message;

  const next: ZoneResult = { ...result, message: rephrased };

  // Defensive guarantee: the zone decision is never the model's to make.
  if (next.zone !== result.zone) {
    throw new Error(
      "messaging layer attempted to change the zone — this is forbidden",
    );
  }

  return next;
}
