import type {
  EarlyWarningSign,
  SignCategory,
  ZoneId,
} from "@/lib/types";

/**
 * A SMALL starter library of early-warning signs, offered as gentle
 * suggestions during onboarding. The person picks the ones that ring true,
 * edits the wording into their own words, and adds their own. Nothing here
 * is prescriptive or clinical — they're conversation starters.
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
  { id: "sleep-less", name: "Sleeping less", category: "sleep", example: "I'm getting fewer than 5 hours, or not feeling tired at night." },
  { id: "sleep-more", name: "Sleeping much more", category: "sleep", example: "I'm in bed most of the day and still exhausted." },

  // People & connection
  { id: "withdraw", name: "Pulling away from people", category: "social", example: "I'm leaving messages unread and cancelling plans." },
  { id: "conflict", name: "Snapping at people", category: "social", example: "Small things make me irritable or suspicious of others." },

  // Thinking & focus
  { id: "racing", name: "Thoughts racing", category: "thought", example: "My mind won't slow down and ideas feel connected in big ways." },
  { id: "focus", name: "Can't focus", category: "thought", example: "I start things and can't follow them through." },
  { id: "meaning", name: "Reading meaning into things", category: "thought", example: "Ordinary events feel like they're about me or a message for me." },

  // Mood & feelings
  { id: "low", name: "Feeling flat or low", category: "mood", example: "Things I usually enjoy feel grey or pointless." },
  { id: "wired", name: "Feeling wired or speeded up", category: "mood", example: "I feel unusually energetic, important, or unstoppable." },

  // Senses & perception
  { id: "noises", name: "Background noise feels meaningful", category: "perception", example: "The radio or traffic seems to be talking about me." },
  { id: "hearing", name: "Hearing things others don't", category: "perception", example: "I'm hearing voices or sounds when no one's there." },

  // Daily routine & self-care
  { id: "skip-meds", name: "Skipping medication", category: "self-care", example: "I've missed doses or stopped taking them." },
  { id: "self-care", name: "Letting basics slide", category: "self-care", example: "I'm skipping meals, showers, or daylight." },
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
