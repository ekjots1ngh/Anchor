import type { JournalEntry, Profile, ZoneId } from "@/lib/types";
import { DEFAULT_CRISIS_LINE, DEFAULT_ZONE_WORDS } from "@/lib/starter-library";

/**
 * Local data store (prototype).
 *
 * Principle (3): the person owns their data. For now everything lives in the
 * browser's localStorage — on the person's own device, never sent anywhere.
 * The API below is deliberately storage-agnostic so we can swap in Supabase
 * (or an encrypted local JSON file) later WITHOUT touching the rest of the
 * app.
 *
 * TODO (production, before any real user data) — the profile now includes
 * free-text JOURNAL entries and per-entry sharing flags. Journal text is
 * private mental-health reflection, and anything a person shares is
 * special-category health data under UK GDPR (Art. 9). A production version
 * MUST add:
 *   1. Encryption at rest (entries are plaintext in localStorage today).
 *   2. A consent audit trail — an append-only log of when each entry's sharing
 *      changed (shared / revoked / by whom), separate from the mutable flag.
 *   3. A lawful basis + explicit consent record for processing/sharing health
 *      data, and data-subject rights (access, erasure) honoured server-side too.
 * This prototype does NONE of the above; do not ship it with real data.
 */

const STORAGE_KEY = "anchor.profile.v1";

/** Fired after any write, so hooks (e.g. useProfile) can re-read live. */
export const PROFILE_CHANGED_EVENT = "anchor:profile-changed";

const isBrowser = (): boolean => typeof window !== "undefined";

function notifyChange(): void {
  if (isBrowser()) window.dispatchEvent(new Event(PROFILE_CHANGED_EVENT));
}

/** A fresh, empty profile prefilled with gentle defaults the person edits. */
export function createEmptyProfile(): Profile {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    displayName: "",
    createdAt: now,
    onboardedAt: null,
    signs: [],
    setupTogether: false,
    zones: {
      green: { id: "green", ...DEFAULT_ZONE_WORDS.green },
      amber: { id: "amber", ...DEFAULT_ZONE_WORDS.amber },
      red: { id: "red", ...DEFAULT_ZONE_WORDS.red },
    },
    baseline: {
      description: "",
      amberAt: 2,
      redAt: 4,
    },
    stayingWellActions: [],
    trustedContacts: [],
    crisisPlan: {
      crisisLineName: DEFAULT_CRISIS_LINE.name,
      crisisLinePhone: DEFAULT_CRISIS_LINE.phone,
    },
    checkIns: [],
    journal: [],
    corrections: [],
    sharing: {
      enabled: false,
      supporterName: "",
      supporterRole: "",
      token: crypto.randomUUID(),
      includeTrends: true,
      includeDriftAreas: true,
      grantedAt: null,
    },
  };
}

/** Read the saved profile. Returns null on the server or if none is saved. */
export function loadProfile(): Profile | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeProfile(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

const ZONE_IDS: ZoneId[] = ["green", "amber", "red"];

const asArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

const asObject = (v: unknown): Record<string, unknown> =>
  typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {};

/**
 * Validate and repair a profile read from storage or imported from a backup
 * file. Fills anything missing (e.g. fields added since an older export) with
 * the same gentle defaults as a fresh profile, so the app never crashes on
 * old data and a person can restore a backup from another device or an
 * earlier version. Returns null if the data isn't recognisably a profile.
 *
 * Privacy-conservative on purpose: any journal entry whose sharing flag is
 * missing or unrecognised is coerced back to "private".
 */
export function normalizeProfile(raw: unknown): Profile | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || !r.id) return null;
  const zones = asObject(r.zones);
  if (!ZONE_IDS.every((z) => typeof zones[z] === "object" && zones[z] !== null)) {
    return null;
  }

  const base = createEmptyProfile();
  const journal = asArray<JournalEntry>(r.journal).map(
    (e): JournalEntry => ({
      ...e,
      sharing:
        e.sharing === "summary" || e.sharing === "full" ? e.sharing : "private",
    }),
  );

  return {
    ...base,
    ...(r as Partial<Profile>),
    id: r.id,
    zones: {
      green: { ...base.zones.green, ...asObject(zones.green), id: "green" },
      amber: { ...base.zones.amber, ...asObject(zones.amber), id: "amber" },
      red: { ...base.zones.red, ...asObject(zones.red), id: "red" },
    },
    baseline: { ...base.baseline, ...asObject(r.baseline) },
    crisisPlan: { ...base.crisisPlan, ...asObject(r.crisisPlan) },
    sharing: { ...base.sharing, ...asObject(r.sharing) },
    signs: asArray(r.signs),
    stayingWellActions: asArray(r.stayingWellActions),
    trustedContacts: asArray(r.trustedContacts),
    checkIns: asArray(r.checkIns),
    journal,
    corrections: asArray(r.corrections),
  };
}

/** Persist the profile. No-op on the server. */
export function saveProfile(profile: Profile): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  notifyChange();
}

/** Erase everything. The person can do this at any time, no questions asked. */
export function clearProfile(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_KEY);
  notifyChange();
}

/** True once the person has completed onboarding. */
export function hasOnboarded(): boolean {
  return loadProfile()?.onboardedAt != null;
}
