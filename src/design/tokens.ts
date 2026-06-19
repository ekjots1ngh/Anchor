/**
 * Design tokens, in code.
 *
 * These mirror the Tailwind theme (tailwind.config.ts) and exist so that
 * non-CSS code (e.g. the rules engine's presentation layer) can refer to
 * zones by a single source of truth instead of hard-coding hex values.
 *
 * Two zones. No red. See README → "Design principles".
 */

export type Zone = "steady" | "checkin";

export interface ZoneToken {
  id: Zone;
  /** Short, human label shown in the UI. */
  label: string;
  /** One calm sentence describing the zone. */
  description: string;
  /** Tailwind utility fragments, so components stay declarative. */
  classes: {
    badgeBg: string;
    badgeText: string;
    accentBar: string;
    softBg: string;
  };
}

export const ZONES: Record<Zone, ZoneToken> = {
  steady: {
    id: "steady",
    label: "Steady",
    description: "Things look steady today.",
    classes: {
      badgeBg: "bg-steady-100",
      badgeText: "text-steady-700",
      accentBar: "bg-steady-400",
      softBg: "bg-steady-50",
    },
  },
  checkin: {
    id: "checkin",
    label: "Worth a check-in",
    description: "A few of your early-warning signs are showing. Might be worth reaching out.",
    classes: {
      badgeBg: "bg-checkin-100",
      badgeText: "text-checkin-700",
      accentBar: "bg-checkin-400",
      softBg: "bg-checkin-50",
    },
  },
};

/** Spacing scale (rem) — kept generous on purpose. */
export const space = {
  xs: "0.5rem",
  sm: "0.75rem",
  md: "1.25rem",
  lg: "2rem",
  xl: "3rem",
} as const;

export const radius = {
  card: "1.25rem",
  pill: "9999px",
} as const;
