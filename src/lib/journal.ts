import type { JournalEntry, JournalSharing, Profile } from "@/lib/types";

/**
 * Journal logic — see DESIGN.md.
 *
 * PRIVACY MODEL. Journal entries are private by default and belong to the
 * person. Anchor does NOT scan, summarise, or AI-flag journal text — analysing
 * private thoughts silently would break trust. The ONLY thing that ever leaves
 * an entry's privacy is an explicit, per-entry choice by the person, expressed
 * as its `sharing` flag, surfaced read-only via `sharedJournal()` below.
 *
 * TODO (production): journal text is special-category health data under UK GDPR
 * (Art. 9). Needs encryption at rest and a consent audit trail — see the note in
 * src/lib/store.ts. This prototype stores plaintext locally.
 */

/** Gentle, optional prompts. The person can use one or ignore them entirely. */
export const JOURNAL_PROMPTS: string[] = [
  "What's on your mind?",
  "How are you doing, honestly?",
  "What's felt steady today?",
  "Is anything sitting heavily right now?",
  "What helped, even a little?",
  "What would you want a kind friend to know?",
];

/** A fresh, empty entry — private by default. */
export function newEntry(prompt?: string): JournalEntry {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    text: "",
    prompt,
    sharing: "private",
  };
}

/** Plain, human label for an entry's sharing state. */
export function sharingLabel(sharing: JournalSharing): string {
  if (sharing === "full") return "Shared with your clinician";
  if (sharing === "summary") return "Shared as a summary";
  return "Private to you";
}

/** The named clinician, if the person has set one, else a gentle generic. */
export function clinicianName(profile: Profile): string {
  return profile.sharing?.supporterName?.trim() || "your clinician";
}

/** Entries, newest first. Tolerates an older profile with no journal. */
export function entriesNewestFirst(profile: Profile): JournalEntry[] {
  return [...(profile.journal ?? [])].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

export interface SharedJournal {
  /** Entries the person chose to share in full — read-only text. */
  fullEntries: { id: string; date: string; text: string }[];
  /** Dates of entries shared as a summary only. NO text is ever included. */
  summaryDates: string[];
}

/**
 * The single, auditable projection of what a clinician may see from the journal.
 * The clinician summary (/summary) reuses THIS — there is no parallel path.
 *
 * Guarantees (covered by tests):
 *  - "private" entries appear nowhere — not their text, not even their date.
 *  - "summary" entries contribute a date only; their text is never included.
 *  - "full" entries contribute their text, read-only.
 * Revoking an entry back to "private" removes it from this projection entirely.
 */
export function sharedJournal(profile: Profile): SharedJournal {
  const entries = entriesNewestFirst(profile);
  return {
    fullEntries: entries
      .filter((e) => e.sharing === "full")
      .map((e) => ({ id: e.id, date: e.createdAt, text: e.text })),
    summaryDates: entries
      .filter((e) => e.sharing === "summary")
      .map((e) => e.createdAt),
  };
}

/** True if the person has shared anything from their journal at all. */
export function hasSharedJournal(profile: Profile): boolean {
  const s = sharedJournal(profile);
  return s.fullEntries.length > 0 || s.summaryDates.length > 0;
}
