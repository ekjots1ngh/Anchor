import type { ZoneId } from "@/lib/types";

/**
 * Design tokens, in code — see DESIGN.md.
 *
 * The single source of truth for how each zone is presented. All classes are
 * semantic (steady / drifting / crisis), so they theme for light + dark from
 * the variables in globals.css. Three zones, and NO alarm colour: the crisis
 * zone is a dignified clay, never an emergency red.
 */

export interface ZoneStyle {
  badgeBg: string;
  badgeText: string;
  dot: string;
  softBg: string;
  ring: string;
}

export const ZONE_STYLES: Record<ZoneId, ZoneStyle> = {
  green: {
    badgeBg: "bg-steady-soft",
    badgeText: "text-steady-text",
    dot: "bg-steady",
    softBg: "bg-steady-soft",
    ring: "ring-steady-border",
  },
  amber: {
    badgeBg: "bg-drifting-soft",
    badgeText: "text-drifting-text",
    dot: "bg-drifting",
    softBg: "bg-drifting-soft",
    ring: "ring-drifting-border",
  },
  red: {
    badgeBg: "bg-crisis-soft",
    badgeText: "text-crisis-text",
    dot: "bg-crisis",
    softBg: "bg-crisis-soft",
    ring: "ring-crisis-border",
  },
};

/**
 * The one input style, shared by every text field and select. Surface fill,
 * hairline border, generous padding, and the accent focus ring.
 */
export const inputClass =
  "w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink placeholder:text-ink-faint focus:outline-none focus-visible:ring-2 focus-visible:ring-accent";

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
