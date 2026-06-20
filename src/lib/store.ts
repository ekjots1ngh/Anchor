import type { Profile } from "@/lib/types";
import { DEFAULT_CRISIS_LINE, DEFAULT_ZONE_WORDS } from "@/lib/starter-library";

/**
 * Local data store (prototype).
 *
 * Principle (3): the person owns their data. For now everything lives in the
 * browser's localStorage — on the person's own device, never sent anywhere.
 * The API below is deliberately storage-agnostic so we can swap in Supabase
 * (or an encrypted local JSON file) later WITHOUT touching the rest of the
 * app.
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
    corrections: [],
  };
}

/** Read the saved profile. Returns null on the server or if none is saved. */
export function loadProfile(): Profile | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
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
