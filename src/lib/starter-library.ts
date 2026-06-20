import type {
  EarlyWarningSign,
  SignCategory,
  ZoneId,
} from "@/lib/types";

/**
 * A small starter library of early-warning signs, offered as gentle
 * suggestions during onboarding, organised by the five staying-well domains.
 *
 * The wording is drawn from common, well-established relapse-prevention and
 * early-warning-signs / staying-well-plan frameworks (e.g. WRAP — Wellness
 * Recovery Action Plan, and relapse early-signs work such as the Early Signs
 * Scale). It is generic and non-clinical on purpose: the person picks what
 * rings true, rewrites it in their own words, and adds their own. These are
 * conversation starters — NOT a checklist, screening tool, or diagnosis.
 */

export interface StarterSign {
  /** Stable id used when the person picks this suggestion. */
  id: string;
  name: string;
  category: SignCategory;
  /** An example description the person can keep or rewrite in their words. */
  example: string;
}

export const STARTER_SIGNS: StarterSign[] = [
  // Sleep & energy
  { id: "sleep-less", name: "Sleeping less than usual", category: "sleep", example: "I'm getting fewer hours, or not feeling tired at night." },
  { id: "sleep-more", name: "Sleeping much more than usual", category: "sleep", example: "I'm in bed most of the day and still exhausted." },
  { id: "sleep-pattern", name: "Day and night getting mixed up", category: "sleep", example: "I'm up through the night and asleep in the day." },
  { id: "restless", name: "Feeling wired or restless", category: "sleep", example: "I can't settle or slow down, even when I'm tired." },

  // People & connection
  { id: "withdraw", name: "Pulling away from people", category: "social", example: "I'm cancelling plans and going quiet with the people I usually see." },
  { id: "unreachable", name: "Not answering messages or calls", category: "social", example: "I'm leaving texts unread for days." },
  { id: "guarded", name: "Feeling on guard around others", category: "social", example: "I feel suspicious, watched, or like I can't trust people." },
  { id: "alone", name: "Wanting to be completely alone", category: "social", example: "I'd rather shut everyone out right now." },

  // Thinking & perception
  { id: "racing", name: "Thoughts racing or jumping", category: "thinking", example: "My mind won't slow down and ideas feel connected in big ways." },
  { id: "focus", name: "Hard to concentrate", category: "thinking", example: "I start things and can't follow them through." },
  { id: "meaning", name: "Reading special meaning into things", category: "thinking", example: "Ordinary events feel like they're about me or a message for me." },
  { id: "sensing", name: "Hearing or sensing things others don't", category: "thinking", example: "I'm noticing sounds, voices, or things that others don't seem to." },

  // Everyday function
  { id: "skip-meds", name: "Missing or changing my medication", category: "function", example: "I've skipped doses or stopped taking it." },
  { id: "eating", name: "Skipping meals or not eating well", category: "function", example: "I'm forgetting to eat or not bothering with food." },
  { id: "basics", name: "Letting hygiene or basics slide", category: "function", example: "Showering, tidying, daylight: it's all slipping." },
  { id: "tasks", name: "Struggling to keep up", category: "function", example: "Work, study, or chores are piling up and I can't keep on top of them." },

  // Mood & feelings
  { id: "low", name: "Feeling unusually low or flat", category: "mood", example: "Things I usually enjoy feel grey or pointless." },
  { id: "high", name: "Feeling sped-up or invincible", category: "mood", example: "I feel unusually energetic, important, or unstoppable." },
  { id: "irritable", name: "More irritable or quick to anger", category: "mood", example: "Small things set me off more than usual." },
  { id: "anxious", name: "Anxious, tense or frightened", category: "mood", example: "I feel on edge or scared a lot of the time." },
];

/**
 * Gentle DEFAULT zone wording, prefilled so the person has somewhere to
 * start. They rewrite these into their own words during onboarding —
 * Anchor never imposes language like "relapse" or "crisis".
 */
export const DEFAULT_ZONE_WORDS: Record<ZoneId, { label: string; description: string }> = {
  green: {
    label: "Anchored",
    description: "I feel like myself. Steady, rested, connected.",
  },
  amber: {
    label: "Drifting",
    description: "A few signs are showing. Worth slowing down and reaching out.",
  },
  red: {
    label: "In the storm",
    description: "Lots is showing at once. This is when I want real support, fast.",
  },
};

/**
 * A starter crisis line suggestion. The person can change this to whatever
 * service they trust. Prefilled with UK options as an editable example —
 * Anchor makes no assumption that this is the right line for everyone.
 */
export const DEFAULT_CRISIS_LINE = {
  name: "Samaritans",
  phone: "116 123",
} as const;

/** Example staying-well actions, shown as gentle prompts (not saved unless kept). */
export const STAYING_WELL_EXAMPLES: string[] = [
  "Get to bed before midnight",
  "A short walk outside, even ten minutes",
  "Text someone in my circle before things build up",
  "Take medication at the same time each day",
  "One proper meal and a glass of water",
];

/** Turn a picked starter suggestion into a real, person-owned sign. */
export function starterToSign(s: StarterSign): EarlyWarningSign {
  return {
    id: s.id,
    name: s.name,
    category: s.category,
    description: s.example,
    source: "library",
  };
}
