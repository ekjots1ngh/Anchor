import type { Profile, ZoneId } from "@/lib/types";
import { computeZone, computeZoneForProfile } from "@/lib/zone";
import { firstNameOf } from "@/lib/contact";

/**
 * The consent-gated SUPPORTER PROJECTION — the single source of truth for what
 * a family member or care coordinator can see.
 *
 * It is deliberately minimal: zone history and trends, plus generic drift-area
 * categories. It NEVER includes raw private notes — no check-in notes, no sign
 * names or descriptions, no baseline text, no mood/sleep specifics, no contacts,
 * and no crisis-plan details. (There is a test asserting none of that leaks.)
 *
 * The person controls access and can revoke at any time; revoking rotates the
 * token, so this projection is only ever reachable while they allow it.
 */

export type DriftLevel = "steady" | "some" | "elevated";

export interface SupporterDriftArea {
  /** Generic area label (e.g. "Sleep", "Social withdrawal") — not the person's words. */
  label: string;
  level: DriftLevel;
}

export interface SupporterTrendPoint {
  date: string; // ISO; the day only
  zone: ZoneId | null; // null = no check-in that day
}

export interface SupporterView {
  firstName: string;
  currentZone: ZoneId;
  /** The person's own word for the zone (e.g. "Drifting") — zone info, not a note. */
  currentZoneLabel: string;
  updatedAt: string | null; // last check-in time
  checkInCount: number;
  warmingUp: boolean;
  includeTrends: boolean;
  includeDriftAreas: boolean;
  trend: SupporterTrendPoint[];
  driftAreas: SupporterDriftArea[];
}

/** Whether a supporter link with this token may currently view the summary. */
export function canSupporterAccess(
  profile: Profile | null,
  token: string | null,
): boolean {
  if (!profile?.onboardedAt) return false;
  const s = profile.sharing;
  return !!s?.enabled && !!token && token === s.token;
}

const dayKey = (d: Date): string => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

const levelOf = (severity: number): DriftLevel =>
  severity <= 0 ? "steady" : severity < 0.5 ? "some" : "elevated";

/** Zone-only history for the last `days` days, read cumulatively (no scores, no notes). */
function zoneHistory(
  profile: Profile,
  days: number,
  today = new Date(),
): SupporterTrendPoint[] {
  const present = new Set(
    profile.checkIns.map((c) => dayKey(new Date(c.createdAt))),
  );
  const out: SupporterTrendPoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setHours(12, 0, 0, 0);
    date.setDate(today.getDate() - i);

    let zone: ZoneId | null = null;
    if (present.has(dayKey(date))) {
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      const upTo = profile.checkIns.filter(
        (c) => new Date(c.createdAt).getTime() <= end.getTime(),
      );
      zone = computeZone({
        signs: profile.signs,
        checkIns: upTo,
        corrections: profile.corrections ?? [],
      }).zone;
    }
    out.push({ date: date.toISOString(), zone });
  }
  return out;
}

/** Build the read-only summary a supporter sees, honouring the sharing settings. */
export function supporterSummary(profile: Profile): SupporterView {
  const result = computeZoneForProfile(profile);
  const s = profile.sharing;

  const lastCheckIn = [...profile.checkIns]
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
    .slice(-1)[0];

  return {
    firstName: firstNameOf(profile.displayName) || "They",
    currentZone: result.zone,
    currentZoneLabel: profile.zones[result.zone].label,
    updatedAt: lastCheckIn?.createdAt ?? null,
    checkInCount: profile.checkIns.length,
    warmingUp: result.warmingUp,
    includeTrends: s.includeTrends,
    includeDriftAreas: s.includeDriftAreas,
    trend: s.includeTrends ? zoneHistory(profile, 14) : [],
    driftAreas: s.includeDriftAreas
      ? result.drivers.map((d) => ({ label: d.label, level: levelOf(d.severity) }))
      : [],
  };
}
