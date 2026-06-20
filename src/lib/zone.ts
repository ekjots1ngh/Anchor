import type {
  CheckIn,
  EarlyWarningSign,
  Profile,
  SignCategory,
  SleepQuality,
  ZoneCorrection,
  ZoneId,
} from "@/lib/types";

/**
 * ANCHOR ZONE ENGINE — per-person statistical drift detection
 * ===========================================================
 *
 * A PURE, deterministic, fully explainable function. It LEARNS each person's
 * own baseline and normal day-to-day variation for every signal, then flags
 * drift relative to THAT — not a one-size-fits-all threshold.
 *
 * Non-negotiables (see README → "Design principles"):
 *   - No LLM, no network, no randomness, no clock. Same inputs → same output.
 *   - The result explains ITSELF: every signal reports its learned baseline,
 *     its recent level, how far it has drifted (a personal z-score), whether
 *     the drift was *sustained* (CUSUM), and how much it drove the zone.
 *   - Prototype only. No clinical claims, no diagnosis.
 *
 * How it works, per signal
 * ------------------------
 * 1. Each check-in yields a value in [0, 1] (0 = at the well end, 1 = fully
 *    showing) — from sleep quality, mood, and how many of the person's signs
 *    in that category were present.
 * 2. BASELINE: from the person's older check-ins we learn a personal mean (mu)
 *    and spread (sigma = std, floored so a perfectly-steady history doesn't make
 *    the detector hair-trigger). Until there are enough baseline points the
 *    signal is "warming up" and cannot drive a zone.
 * 3. Z-SCORE: how far the recent window's average sits above the personal mean,
 *    in units of the person's own spread:  z = (recentMean - mu) / sigma.
 * 4. CHANGE-POINT (one-sided CUSUM): over the recent window we accumulate
 *    standardized day-over-day excess above a small slack k, resetting at zero.
 *    A single noisy day can't push the cumulative sum past the threshold h; a
 *    sustained shift can. This is what makes the engine resist single-day noise.
 * 5. A signal "drove" the zone only if it has a learned baseline, the CUSUM
 *    fired (sustained), and z > 0 (worse than usual). Its severity scales with
 *    z; sleep and social withdrawal are weighted most heavily.
 *
 * The weighted severities are normalised to a 0..1 score and mapped to a zone.
 * Every parameter is explicit and tunable.
 */

export type SignalKey = SignCategory;

const SIGNAL_ORDER: SignalKey[] = [
  "sleep",
  "social",
  "mood",
  "thinking",
  "function",
];

export const SIGNAL_LABELS: Record<SignalKey, string> = {
  sleep: "Sleep",
  social: "Social withdrawal",
  mood: "Mood",
  thinking: "Thinking & perception",
  function: "Everyday function",
};

export type ZoneWeights = Record<SignalKey, number>;

export interface ZoneOptions {
  /** How many of the most recent check-ins form the "now" window. */
  recentWindow: number;
  /** Cap on how far back the baseline reaches. */
  baselineMaxHistory: number;
  /** Minimum baseline check-ins before a signal can be assessed at all. */
  minBaselineSamples: number;
  /** Floor on personal spread, so a flat history isn't hair-trigger. */
  sigmaFloor: number;
  /** Assumed value before any baseline exists (the "well" end). */
  priorMean: number;
  /** CUSUM slack (allowance) in sigma units — small noise below this is ignored. */
  cusumSlack: number;
  /** CUSUM decision threshold — sustained drift must exceed this to fire. */
  cusumThreshold: number;
  /** z that maps to full severity (1.0). */
  zForFullSeverity: number;
  /** Normalised score at/above which the zone is amber / red. */
  amberAt: number;
  redAt: number;
  /** Pseudo-baseline-samples added per "I'm actually okay" correction. */
  correctionWeight: number;
  /** Per-signal weights — sleep & social are the heaviest by design. */
  weights: ZoneWeights;
}

export const DEFAULT_ZONE_OPTIONS: ZoneOptions = {
  recentWindow: 4,
  baselineMaxHistory: 30,
  minBaselineSamples: 4,
  sigmaFloor: 0.5,
  priorMean: 0,
  cusumSlack: 0.5,
  cusumThreshold: 2.0,
  zForFullSeverity: 3.0,
  amberAt: 0.15,
  redAt: 0.45,
  correctionWeight: 3,
  weights: {
    sleep: 3, // strong early sign — weighted heavily
    social: 3, // social withdrawal — strong early sign — weighted heavily
    mood: 2,
    thinking: 2,
    function: 1.5,
  },
};

/** One signal's full, inspectable contribution to the decision — the "why". */
export interface ZoneDriver {
  signal: SignalKey;
  label: string;
  weight: number;
  /** The person's learned typical level for this signal, in [0, 1]. */
  baselineMean: number;
  /** The recent-window average, in [0, 1]. */
  recentMean: number;
  /** The person's learned spread (std, floored). */
  sigma: number;
  /** Personal z-score: how many of their own sigmas above baseline (>=0 shown). */
  z: number;
  /** Peak CUSUM statistic over the recent window. */
  cusum: number;
  /** Whether the CUSUM detector fired (a sustained shift, not a one-off). */
  fired: boolean;
  /** Whether a personal baseline has been learned yet for this signal. */
  haveBaseline: boolean;
  /** Did this signal actually drive the zone? (baseline + fired + z>0) */
  drove: boolean;
  /** 0..1, scales with z. */
  severity: number;
  /** Alias of severity, kept for UI bars. */
  drift: number;
  /** weight × severity. */
  contribution: number;
  /** This signal's share of the total contribution, in [0, 1]. */
  share: number;
}

export interface ZoneComputation {
  zone: ZoneId;
  /** Normalised weighted severity, in [0, 1]. */
  score: number;
  thresholds: { amber: number; red: number };
  /** Number of check-ins in the recent window actually considered. */
  windowSize: number;
  /** True once every active signal has a learned baseline. */
  baselineReady: boolean;
  /** True while Anchor is still learning the person's baseline. */
  warmingUp: boolean;
  /**
   * True when "I'm actually okay" corrections would have relaxed the zone, but
   * the person's raw history is red, so red is enforced. The crisis safeguard.
   */
  crisisOverride: boolean;
  /** Every signal considered, most influential first. Fully explainable. */
  drivers: ZoneDriver[];
}

export interface ComputeZoneInput {
  signs: EarlyWarningSign[];
  checkIns: CheckIn[];
  /** Recorded "I'm actually okay" corrections that gently tune the baseline. */
  corrections?: ZoneCorrection[];
  options?: Partial<ZoneOptions>;
}

/* ------------------------------------------------------------------ */
/* Pure helpers                                                        */
/* ------------------------------------------------------------------ */

const clamp = (x: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, x));

const mean = (xs: number[]): number =>
  xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0;

/** Sample standard deviation (n-1). 0 for fewer than 2 points. */
const sampleStd = (xs: number[]): number => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  const variance = xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(variance);
};

const sleepBadness = (q: SleepQuality): number =>
  q === "good" ? 0 : q === "okay" ? 0.5 : 1;

const moodBadness = (m: number): number => clamp((5 - m) / 4, 0, 1);

/* ------------------------------------------------------------------ */
/* The engine                                                          */
/* ------------------------------------------------------------------ */

export function computeZone(input: ComputeZoneInput): ZoneComputation {
  const opts: ZoneOptions = {
    ...DEFAULT_ZONE_OPTIONS,
    ...input.options,
    weights: { ...DEFAULT_ZONE_OPTIONS.weights, ...input.options?.weights },
  };
  const corrections = input.corrections ?? [];

  // Group the person's sign ids by category.
  const idsByCategory = {} as Record<SignalKey, string[]>;
  for (const key of SIGNAL_ORDER) idsByCategory[key] = [];
  for (const sign of input.signs) idsByCategory[sign.category].push(sign.id);

  // Which signals are in play: sleep & mood always (every check-in records
  // them); the others only if the person tracks signs in that category.
  const activeSignals = SIGNAL_ORDER.filter(
    (key) => key === "sleep" || key === "mood" || idsByCategory[key].length > 0,
  );

  // Chronological order, oldest first.
  const sorted = [...input.checkIns].sort(
    (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
  );
  const n = sorted.length;
  const recentCount = Math.min(opts.recentWindow, n);
  const recentSlice = sorted.slice(n - recentCount);
  const baselineFull = sorted.slice(0, n - recentCount);
  const baselineSlice = baselineFull.slice(
    Math.max(0, baselineFull.length - opts.baselineMaxHistory),
  );

  // Fraction of a category's signs marked present in one check-in.
  const categoryFraction = (checkIn: CheckIn, key: SignalKey): number => {
    const ids = idsByCategory[key];
    if (ids.length === 0) return 0;
    const present = new Set(
      checkIn.answers.filter((a) => a.present).map((a) => a.signId),
    );
    const hit = ids.reduce((acc, id) => acc + (present.has(id) ? 1 : 0), 0);
    return hit / ids.length;
  };

  // Per-check-in value for a signal, in [0, 1].
  const signalValue = (checkIn: CheckIn, key: SignalKey): number => {
    if (key === "sleep") {
      return Math.max(sleepBadness(checkIn.sleep), categoryFraction(checkIn, "sleep"));
    }
    if (key === "mood") {
      return Math.max(moodBadness(checkIn.mood), categoryFraction(checkIn, "mood"));
    }
    return categoryFraction(checkIn, key);
  };

  // Assess the zone, optionally folding "I'm actually okay" corrections into
  // each signal's learned baseline (gentle pseudo-observations). Baseline
  // readiness still depends on REAL history, so corrections can't fake a baseline.
  const assess = (folded: ZoneCorrection[]) => {
    const rawDrivers = activeSignals.map((signal) => {
      const recentVals = recentSlice.map((c) => signalValue(c, signal));
      const realBaseVals = baselineSlice.map((c) => signalValue(c, signal));

      const correctionVals: number[] = [];
      for (const corr of folded) {
        const match = corr.signals.find((s) => s.category === signal);
        if (match) {
          for (let i = 0; i < opts.correctionWeight; i++) {
            correctionVals.push(match.value);
          }
        }
      }
      const baseVals = [...realBaseVals, ...correctionVals];

      const haveBaseline = realBaseVals.length >= opts.minBaselineSamples;
      const mu = haveBaseline ? mean(baseVals) : opts.priorMean;
      const sigma = Math.max(haveBaseline ? sampleStd(baseVals) : 0, opts.sigmaFloor);
      const recentMean = mean(recentVals);
      const z = (recentMean - mu) / sigma;

      // One-sided upper CUSUM over the recent window's standardized residuals.
      let s = 0;
      let cusum = 0;
      for (const v of recentVals) {
        const e = (v - mu) / sigma;
        s = Math.max(0, s + e - opts.cusumSlack);
        cusum = Math.max(cusum, s);
      }
      const fired = cusum >= opts.cusumThreshold;

      const drove = haveBaseline && fired && z > 0;
      const severity = drove ? clamp(z / opts.zForFullSeverity, 0, 1) : 0;
      const weight = opts.weights[signal];

      return {
        signal,
        weight,
        baselineMean: mu,
        recentMean,
        sigma,
        z: Math.max(0, z),
        cusum,
        fired,
        haveBaseline,
        drove,
        severity,
        contribution: weight * severity,
      };
    });

    const totalContribution = rawDrivers.reduce((sum, d) => sum + d.contribution, 0);
    const totalWeight = rawDrivers.reduce((sum, d) => sum + d.weight, 0);
    const score = totalWeight > 0 ? totalContribution / totalWeight : 0;

    const drivers: ZoneDriver[] = rawDrivers
      .map((d) => ({
        ...d,
        label: SIGNAL_LABELS[d.signal],
        drift: d.severity,
        share: totalContribution > 0 ? d.contribution / totalContribution : 0,
      }))
      .sort(
        (a, b) =>
          b.contribution - a.contribution ||
          b.weight - a.weight ||
          a.signal.localeCompare(b.signal),
      );

    const baselineReady =
      activeSignals.length > 0 && rawDrivers.every((d) => d.haveBaseline);
    const zone: ZoneId =
      score >= opts.redAt ? "red" : score >= opts.amberAt ? "amber" : "green";

    return { zone, score, drivers, baselineReady };
  };

  const tuned = assess(corrections);
  let chosen = tuned;
  let crisisOverride = false;
  if (corrections.length > 0) {
    // CRISIS SAFEGUARD: a dismissal can relax amber, but it must never hide a
    // genuine red. If the person's actual history (ignoring every correction)
    // is red, red stands — and the crisis routing stays available.
    const raw = assess([]);
    if (raw.zone === "red" && tuned.zone !== "red") {
      chosen = raw;
      crisisOverride = true;
    }
  }

  return {
    zone: chosen.zone,
    score: chosen.score,
    thresholds: { amber: opts.amberAt, red: opts.redAt },
    windowSize: recentCount,
    baselineReady: chosen.baselineReady,
    warmingUp: !chosen.baselineReady,
    crisisOverride,
    drivers: chosen.drivers,
  };
}

/** Convenience adapter for the app: derive engine inputs from a Profile. */
export function computeZoneForProfile(
  profile: Profile,
  options?: Partial<ZoneOptions>,
): ZoneComputation {
  return computeZone({
    signs: profile.signs,
    checkIns: profile.checkIns,
    corrections: profile.corrections ?? [],
    options,
  });
}
