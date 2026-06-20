import type { ZoneComputation, ZoneDriver } from "@/lib/zone";

/**
 * Turns the drift engine's output into a plain-language explanation of WHY the
 * zone is what it is — which of the person's own signals drifted above THEIR
 * usual range, by how much, and whether it was sustained. Pure and
 * deterministic: no LLM, no judgement. This is the feature that proves Anchor
 * mirrors the person's own signs rather than an AI rating them.
 */

export interface ExplainedSignal {
  label: string;
  drift: number; // severity 0..1, for the little bar
  drove: boolean;
  /** "is running well above your usual, and stayed there" */
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

/** Plain-language description of how far a signal has drifted, from its z-score. */
function driftPhrase(d: ZoneDriver): string {
  if (!d.haveBaseline) return "is still being learned — not enough history yet";
  if (d.z < 0.5) return "is sitting in your usual range";

  const howFar =
    d.z < 1.5
      ? "a little above your usual"
      : d.z < 3
        ? "well above your usual"
        : "far above your usual";

  // The number, stated plainly: z is "how many of your own normal swings".
  const sigmas = `about ${d.z.toFixed(1)}× your usual day-to-day swing`;

  if (d.drove) return `is running ${howFar} (${sigmas}), and has stayed there`;
  // Elevated but not a sustained change yet (CUSUM didn't fire) — likely a blip.
  return `nudged ${howFar} on a day or two (${sigmas}), but not in a sustained way`;
}

function sharePhrase(share: number, drove: boolean): string {
  if (!drove) return "";
  if (share >= 0.4) return "the biggest part of why";
  if (share >= 0.2) return "a meaningful part of why";
  return "a small part of why";
}

export function explainZone(
  result: ZoneComputation,
  zoneLabel: string,
): ZoneExplanation {
  const label = zoneLabel.toLowerCase();
  const movers = result.drivers.filter((d) => d.drove);
  const checkIns = `${result.windowSize} ${result.windowSize === 1 ? "check-in" : "check-ins"}`;

  let lead: string;
  if (result.warmingUp) {
    lead =
      "Anchor is still learning your usual range — it needs a few more check-ins before it can tell drift from an ordinary off-day. For now, nothing here stands out.";
  } else if (result.zone === "green") {
    lead = `Every one of your signs is sitting in its usual range for you — that's why you're ${label}.`;
  } else {
    lead = `You're ${label} because ${
      movers.length === 1 ? "one of your signs has" : "a few of your signs have"
    } drifted above what's normal for you and stayed there across your last ${checkIns} — not just a single off-day.`;
  }

  const signals: ExplainedSignal[] = result.drivers.map((d) => ({
    label: d.label,
    drift: d.drift,
    drove: d.drove,
    phrase: driftPhrase(d),
    sharePhrase: sharePhrase(d.share, d.drove),
  }));

  const ruleLine =
    "Anchor learned your own baseline and normal range from your past check-ins, then looked for signs that drifted above it and stayed there over several days (a change-point detector, so a single noisy day doesn't count). Sleep and connection are weighted the most. It's your own numbers, compared only to your own past — never an AI deciding how you are.";

  const reassurance = movers.length
    ? "None of this is a judgement about you. These are the early-warning signs you picked while well, measured against your own baseline by a fixed rule."
    : "This is only your own signs, compared to your own usual — reflected back, never judged.";

  return { lead, signals, ruleLine, reassurance };
}
