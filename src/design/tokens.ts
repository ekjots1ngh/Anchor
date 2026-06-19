import type { ZoneId } from "@/lib/types";

/**
 * Design tokens, in code.
 *
 * These mirror the Tailwind theme (tailwind.config.ts) and give non-CSS code
 * a single source of truth for how each zone is presented.
 *
 * Three zones — and NO alarm colour. "red" is rendered as a muted, dignified
 * clay/terracotta, never an emergency red. Anchor is calm by design.
 * See README → "Design principles".
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
    badgeBg: "bg-steady-100",
    badgeText: "text-steady-700",
    dot: "bg-steady-400",
    softBg: "bg-steady-50",
    ring: "ring-steady-200",
  },
  amber: {
    badgeBg: "bg-checkin-100",
    badgeText: "text-checkin-700",
    dot: "bg-checkin-400",
    softBg: "bg-checkin-50",
    ring: "ring-checkin-200",
  },
  red: {
    badgeBg: "bg-crisis-100",
    badgeText: "text-crisis-700",
    dot: "bg-crisis-400",
    softBg: "bg-crisis-50",
    ring: "ring-crisis-200",
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
