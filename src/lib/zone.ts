import type {
  CheckIn,
  EarlyWarningSign,
  MoodRating,
  Profile,
  SignCategory,
  SleepQuality,
  ZoneId,
} from "@/lib/types";

/**
 * ANCHOR ZONE ENGINE
 * ==================
 *
 * A PURE, deterministic, fully explainable function that turns a person's
 * baseline + recent check-ins into a zone (green / amber / red).
 *
 * Non-negotiables (see README → "Design principles"):
 *   - No LLM, no network, no randomness, no clock. Same inputs → same output,
 *     forever. Everything below can be read and reasoned about by a person or
 *     a clinician.
 *   - The result explains ITSELF: it returns which signals drove the decision
 *     and by how much (`drivers`), so nothing about the zone is a black box.
 *
 * How it works
 * ------------
 * For each *signal* we measure how far the person's recent check-ins have
 * DRIFTED from their steady baseline, averaged over a rolling window of their
 * most recent check-ins. Each signal's drift is a number in [0, 1] (0 = at
 * baseline, 1 = maximally drifted). We multiply by a weight and sum.
 *
 * Sleep and social withdrawal are weighted the most heavily, because they are
 * strong, early indicators of drift for many people. Mood is next, then the
 * remaining sign categories.
 *
 * The weighted total is normalised to a 0..1 `score` and compared against two
 * thresholds to pick the zone. The signals, weights, window and thresholds
 * are all explicit and configurable — there is no hidden state.
 */

/** The signals the engine reasons about. One per sign category. */
export type SignalKey = SignCategory;

const SIGNAL_ORDER: SignalKey[] = [
  "sleep",
  "social",
  "mood",
  "thought",
  "perception",
  "self-care",
];

/** Human-friendly labels for each signal, used in the explainable output. */
export const SIGNAL_LABELS: Record<SignalKey, string> = {
  sleep: "Sleep",
  social: "Social withdrawal",
  mood: "Mood",
  thought: "Thinking & focus",
  perception: "Senses & perception",
  "self-care": "Daily routine & self-care",
};

/**
 * The person's steady reference point. Note this is the engine's own notion
 * of baseline (the "well" version of these signals); it is distinct from the
 * domain `Baseline` type, which holds the simpler count thresholds used by the
 * legacy rules engine.
 */
export interface ZoneBaseline {
  /** How the person usually sleeps when well. */
  sleep: SleepQuality;
  /** The person's usual mood when well (1–5). */
  mood: MoodRating;
}

export const DEFAULT_ZONE_BASELINE: ZoneBaseline = { sleep: "good", mood: 4 };

export type ZoneWeights = Record<SignalKey, number>;

export interface ZoneOptions {
  /** How many of the most recent check-ins to average over. */
  windowSize: number;
  /** Normalised score (0..1) at or above which the zone is amber. */
  amberAt: number;
  /** Normalised score (0..1) at or above which the zone is red. */
  redAt: number;
  /** Per-signal weights. Sleep & social are the heaviest by design. */
  weights: ZoneWeights;
}

export const DEFAULT_ZONE_OPTIONS: ZoneOptions = {
  windowSize: 7,
  amberAt: 0.25,
  redAt: 0.5,
  weights: {
    sleep: 3, // strong early sign — weighted heavily
    social: 3, // social withdrawal — strong early sign — weighted heavily
    mood: 2,
    thought: 1.5,
    perception: 1.5,
    "self-care": 1,
  },
};

/** One signal's contribution to the decision — the "why". */
export interface ZoneDriver {
  signal: SignalKey;
  label: string;
  weight: number;
  /** Mean drift from baseline over the window, in [0, 1]. */
  drift: number;
  /** weight × drift — the raw push toward a higher zone. */
  contribution: number;
  /** This signal's share of the total contribution, in [0, 1]. */
  share: number;
}

export interface ZoneComputation {
  zone: ZoneId;
  /** Normalised weighted drift, in [0, 1]. */
  score: number;
  thresholds: { amber: number; red: number };
  /** Number of check-ins actually considered (after applying the window). */
  windowSize: number;
  /** Every signal considered, most influential first. Fully explainable. */
  drivers: ZoneDriver[];
}

export interface ComputeZoneInput {
  signs: EarlyWarningSign[];
  checkIns: CheckIn[];
  baseline: ZoneBaseline;
  options?: Partial<ZoneOptions>;
}

/* ------------------------------------------------------------------ */
/* Pure helpers                                                        */
/* ------------------------------------------------------------------ */

const clamp = (x: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, x));

/** Sleep "badness" in [0, 1]: good = 0, okay = 0.5, poor = 1. */
const sleepBadness = (q: SleepQuality): number =>
  q === "good" ? 0 : q === "okay" ? 0.5 : 1;

/** Mood "badness" in [0, 1]: 5 = 0 … 1 = 1. */
const moodBadness = (m: number): number => clamp((5 - m) / 4, 0, 1);

/* ------------------------------------------------------------------ */
/* The engine                                                          */
/* ------------------------------------------------------------------ */

/**
 * Compute the current zone from a baseline and recent check-ins.
 *
 * Pure: no side effects, no I/O, no clock, no randomness.
 */
export function computeZone(input: ComputeZoneInput): ZoneComputation {
  const opts: ZoneOptions = {
    ...DEFAULT_ZONE_OPTIONS,
    ...input.options,
    weights: { ...DEFAULT_ZONE_OPTIONS.weights, ...input.options?.weights },
  };

  // Group the person's sign ids by category so we can measure category drift.
  const idsByCategory = {} as Record<SignalKey, string[]>;
  for (const key of SIGNAL_ORDER) idsByCategory[key] = [];
  for (const sign of input.signs) idsByCategory[sign.category].push(sign.id);

  // Rolling window: the most recent `windowSize` check-ins, newest first.
  const window = [...input.checkIns]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, Math.max(0, opts.windowSize));

  const baseSleep = sleepBadness(input.baseline.sleep);
  const baseMood = moodBadness(input.baseline.mood);

  // Which signals are in play. Sleep & mood always (every check-in records
  // them); the others only if the person tracks signs in that category.
  const activeSignals = SIGNAL_ORDER.filter(
    (key) =>
      key === "sleep" || key === "mood" || idsByCategory[key].length > 0,
  );

  // Fraction of a category's signs marked present in a single check-in.
  const categoryFraction = (checkIn: CheckIn, key: SignalKey): number => {
    const ids = idsByCategory[key];
    if (ids.length === 0) return 0;
    const present = new Set(
      checkIn.answers.filter((a) => a.present).map((a) => a.signId),
    );
    const hit = ids.reduce((n, id) => n + (present.has(id) ? 1 : 0), 0);
    return hit / ids.length;
  };

  // Per-check-in drift for a signal, in [0, 1].
  const driftFor = (checkIn: CheckIn, key: SignalKey): number => {
    if (key === "sleep") {
      const quality = clamp(sleepBadness(checkIn.sleep) - baseSleep, 0, 1);
      return Math.max(quality, categoryFraction(checkIn, "sleep"));
    }
    if (key === "mood") {
      const rating = clamp(moodBadness(checkIn.mood) - baseMood, 0, 1);
      return Math.max(rating, categoryFraction(checkIn, "mood"));
    }
    return categoryFraction(checkIn, key);
  };

  // Mean drift over the window for each active signal.
  const meanDrift = (key: SignalKey): number => {
    if (window.length === 0) return 0;
    const total = window.reduce((sum, c) => sum + driftFor(c, key), 0);
    return total / window.length;
  };

  const raw = activeSignals.map((signal) => {
    const drift = meanDrift(signal);
    const weight = opts.weights[signal];
    return { signal, weight, drift, contribution: weight * drift };
  });

  const totalContribution = raw.reduce((s, r) => s + r.contribution, 0);
  const maxContribution = raw.reduce((s, r) => s + r.weight, 0); // drift ≤ 1
  const score = maxContribution > 0 ? totalContribution / maxContribution : 0;

  const drivers: ZoneDriver[] = raw
    .map((r) => ({
      signal: r.signal,
      label: SIGNAL_LABELS[r.signal],
      weight: r.weight,
      drift: r.drift,
      contribution: r.contribution,
      share: totalContribution > 0 ? r.contribution / totalContribution : 0,
    }))
    // Most influential first; stable tie-breaks for deterministic output.
    .sort(
      (a, b) =>
        b.contribution - a.contribution ||
        b.weight - a.weight ||
        a.signal.localeCompare(b.signal),
    );

  const zone: ZoneId =
    score >= opts.redAt ? "red" : score >= opts.amberAt ? "amber" : "green";

  return {
    zone,
    score,
    thresholds: { amber: opts.amberAt, red: opts.redAt },
    windowSize: window.length,
    drivers,
  };
}

/**
 * Convenience adapter for the app: derive the engine inputs from a Profile.
 * The steady baseline defaults to good sleep / mood 4 until onboarding starts
 * capturing it explicitly.
 */
export function computeZoneForProfile(
  profile: Profile,
  options?: Partial<ZoneOptions>,
): ZoneComputation {
  return computeZone({
    signs: profile.signs,
    checkIns: profile.checkIns,
    baseline: DEFAULT_ZONE_BASELINE,
    options,
  });
}
