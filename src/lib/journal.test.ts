import { describe, it, expect } from "vitest";
import { createEmptyProfile } from "@/lib/store";
import { hasSharedJournal, sharedJournal } from "@/lib/journal";
import type { JournalEntry, JournalSharing, Profile } from "@/lib/types";

let n = 0;
function entry(text: string, sharing: JournalSharing): JournalEntry {
  n += 1;
  const ts = new Date(2026, 0, n).toISOString();
  return { id: `e${n}`, createdAt: ts, updatedAt: ts, text, sharing };
}

function withJournal(entries: JournalEntry[]): Profile {
  return { ...createEmptyProfile(), journal: entries };
}

describe("journal sharing", () => {
  it("keeps private entries fully private — not text, not even a date", () => {
    const secret = "PRIVATE-THOUGHT-do-not-share";
    const shared = sharedJournal(withJournal([entry(secret, "private")]));

    expect(shared.fullEntries).toHaveLength(0);
    expect(shared.summaryDates).toHaveLength(0);
    expect(JSON.stringify(shared)).not.toContain(secret);
  });

  it("shares full-text entries read-only, with their text", () => {
    const body = "Today felt steady and I cooked a proper meal.";
    const shared = sharedJournal(withJournal([entry(body, "full")]));

    expect(shared.fullEntries).toHaveLength(1);
    expect(shared.fullEntries[0].text).toBe(body);
    expect(shared.summaryDates).toHaveLength(0);
  });

  it("shares a summary entry as a DATE ONLY — never its text", () => {
    const body = "SUMMARY-ONLY-private-words";
    const shared = sharedJournal(withJournal([entry(body, "summary")]));

    expect(shared.fullEntries).toHaveLength(0);
    expect(shared.summaryDates).toHaveLength(1);
    // The text of a summary-shared entry must never appear anywhere.
    expect(JSON.stringify(shared)).not.toContain(body);
  });

  it("revoking back to private removes an entry from the projection", () => {
    const e = entry("was shared, now revoked", "full");
    expect(sharedJournal(withJournal([e])).fullEntries).toHaveLength(1);

    const revoked: JournalEntry = { ...e, sharing: "private" };
    const after = sharedJournal(withJournal([revoked]));
    expect(after.fullEntries).toHaveLength(0);
    expect(after.summaryDates).toHaveLength(0);
    expect(JSON.stringify(after)).not.toContain("was shared, now revoked");
  });

  it("a clinician only ever sees explicitly-shared entries (no leak)", () => {
    const priv = "PRIVATE-never-leaves-device";
    const summ = "SUMMARY-text-stays-hidden";
    const full = "FULL-this-one-is-shared";

    const shared = sharedJournal(
      withJournal([
        entry(priv, "private"),
        entry(summ, "summary"),
        entry(full, "full"),
      ]),
    );

    expect(shared.fullEntries.map((e) => e.text)).toEqual([full]);
    expect(shared.summaryDates).toHaveLength(1);

    // Serialise the whole projection and assert neither private nor summary
    // text appears anywhere — only the explicitly full-shared entry's text.
    const blob = JSON.stringify(shared);
    expect(blob).toContain(full);
    expect(blob).not.toContain(priv);
    expect(blob).not.toContain(summ);
  });

  it("hasSharedJournal reflects whether anything is shared", () => {
    expect(hasSharedJournal(withJournal([entry("a", "private")]))).toBe(false);
    expect(hasSharedJournal(withJournal([entry("a", "summary")]))).toBe(true);
    expect(hasSharedJournal(withJournal([entry("a", "full")]))).toBe(true);
    expect(hasSharedJournal(withJournal([]))).toBe(false);
  });
});
