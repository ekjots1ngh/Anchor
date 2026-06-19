import type { Profile } from "@/lib/types";

/**
 * Local data store (scaffold).
 *
 * Principle (3): the person owns their data. For this prototype we keep
 * everything in a single local JSON file under /data, which is gitignored
 * so a person's signs and notes never get committed. The interface below
 * is deliberately storage-agnostic so we can swap this implementation for
 * Supabase later WITHOUT touching the rest of the app.
 *
 * NOTE: This is a placeholder. Reads/writes are not wired into the routes
 * yet — we're scaffolding. The shape is what matters here.
 */

export interface ProfileStore {
  get(id: string): Promise<Profile | null>;
  save(profile: Profile): Promise<void>;
  /** Hard delete — the person can erase their data at any time. */
  remove(id: string): Promise<void>;
}

/**
 * A starter profile used to render the scaffolded screens with realistic,
 * person-authored content. Replace with real onboarding output later.
 */
export const sampleProfile: Profile = {
  id: "sample",
  displayName: "Friend",
  onboardedAt: null,
  signs: [
    { id: "sleep", label: "Sleeping less than 5 hours", weight: 2 },
    { id: "withdraw", label: "Not replying to friends for a few days", weight: 1 },
    { id: "noise", label: "Background noises feel like they mean something", weight: 3 },
    { id: "skip-meds", label: "Skipping medication", weight: 3 },
  ],
  plan: {
    whatHelps: [
      "Getting to bed before midnight",
      "A walk outside, even a short one",
      "Texting Sam before things build up",
    ],
    contacts: [
      { id: "sam", name: "Sam", relationship: "Close friend" },
      { id: "cc", name: "Care coordinator", relationship: "Clinical team" },
    ],
    // People agree this threshold together. Here: any single weight-3 sign,
    // or a combination, reaches "worth a check-in".
    checkinThreshold: 3,
  },
  checkIns: [],
};

/**
 * In-memory placeholder implementation. Swappable for a JSON-file or
 * Supabase implementation behind the same interface.
 */
class MemoryProfileStore implements ProfileStore {
  private profiles = new Map<string, Profile>([[sampleProfile.id, sampleProfile]]);

  async get(id: string): Promise<Profile | null> {
    return this.profiles.get(id) ?? null;
  }

  async save(profile: Profile): Promise<void> {
    this.profiles.set(profile.id, profile);
  }

  async remove(id: string): Promise<void> {
    this.profiles.delete(id);
  }
}

export const profileStore: ProfileStore = new MemoryProfileStore();
