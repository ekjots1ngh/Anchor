import type { ZoneComputation } from "@/lib/zone";

/**
 * Turns the rules engine's output into a plain-language explanation of WHY the
 * zone is what it is — exactly which of the person's own signals moved, and by
 * how much. Pure and deterministic: no LLM, no judgement. This is the feature
 * that proves Anchor mirrors the person's own signs rather than an AI rating
 * them.
 */

export interface ExplainedSignal {
  label: string;
  drift: number; // 0..1, for the little bar
  drove: boolean; // contributed to the decision at all
  /** "has drifted a lot from your baseline" */
  phrase: string;
  /** "" or "the biggest part of why", etc. */
  sharePhrase: string;
}

export interface ZoneExplanation {
  lead: string;
  signals: ExplainedSignal[]; // movers first (engine order)
  ruleLine: string;
  reassurance: string;
}

function driftPhrase(d: number): string {
  if (d <= 0) return "has stayed right at your baseline";
  if (d < 0.34) return "has drifted a little from your baseline";
  if (d < 0.66) return "has drifted somewhat from your baseline";
  return "has drifted a lot from your baseline";
}

function sharePhrase(share: number, drove: boolean): string {
  if (!drove) return "";
  if (share >= 0.4) return "the biggest part of why";
  if (share >= 0.2) return "a meaningful part of why";
  return "a small part of why";
}

const pct = (n: number): number => Math.round(n * 100);

export function explainZone(
  result: ZoneComputation,
  zoneLabel: string,
): ZoneExplanation {
  const label = zoneLabel.toLowerCase();
  const movers = result.drivers.filter((d) => d.drift > 0);
  const checkIns = `${result.windowSize} ${result.windowSize === 1 ? "check-in" : "check-ins"}`;

  const lead =
    result.zone === "green"
      ? `Everything's sitting at your baseline right now — that's why you're ${label}.`
      : `You're ${label} because ${
          movers.length === 1 ? "one" : "a few"
        } of the signs you chose have moved away from your baseline over your last ${checkIns}.`;

  const signals: ExplainedSignal[] = result.drivers.map((d) => ({
    label: d.label,
    drift: d.drift,
    drove: d.drift > 0,
    phrase: driftPhrase(d.drift),
    sharePhrase: sharePhrase(d.share, d.drift > 0),
  }));

  const ruleLine = `All together, your signs are about ${pct(
    result.score,
  )}% of the way drifted. Anchor reads that as ${label} because it's past the ${pct(
    result.thresholds.amber,
  )}% mark; it would only reach the most-support zone past ${pct(
    result.thresholds.red,
  )}%. That's the whole rule — a simple count you can read, the same every time.`;

  const reassurance = movers.length
    ? "None of this is a judgement about you. These are the early-warning signs you picked while well, counted by a fixed rule — not an AI deciding how you are."
    : "This is only your own signs, reflected back — never an AI deciding how you are.";

  return { lead, signals, ruleLine, reassurance };
}
