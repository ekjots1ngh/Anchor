import { describe, it, expect } from "vitest";
import { createEmptyProfile, normalizeProfile } from "@/lib/store";
import type { Profile } from "@/lib/types";

describe("normalizeProfile (backup import / old-data repair)", () => {
  it("round-trips a full exported profile unchanged where it matters", () => {
    const original = createEmptyProfile();
    original.displayName = "Alex";
    original.onboardedAt = new Date().toISOString();

    const restored = normalizeProfile(JSON.parse(JSON.stringify(original)));
    expect(restored).not.toBeNull();
    expect(restored!.id).toBe(original.id);
    expect(restored!.displayName).toBe("Alex");
    expect(restored!.onboardedAt).toBe(original.onboardedAt);
    expect(restored!.zones.green.label).toBe(original.zones.green.label);
  });

  it("fills fields missing from an older export with gentle defaults", () => {
    const old = createEmptyProfile() as Partial<Profile> & Record<string, unknown>;
    // Simulate an export from before journal/corrections/sharing existed.
    delete old.journal;
    delete old.corrections;
    delete old.sharing;
    delete old.setupTogether;

    const restored = normalizeProfile(old);
    expect(restored).not.toBeNull();
    expect(restored!.journal).toEqual([]);
    expect(restored!.corrections).toEqual([]);
    expect(restored!.sharing.enabled).toBe(false);
    expect(restored!.sharing.token).toBeTruthy();
  });

  it("rejects data that isn't recognisably a profile", () => {
    expect(normalizeProfile(null)).toBeNull();
    expect(normalizeProfile("a string")).toBeNull();
    expect(normalizeProfile(42)).toBeNull();
    expect(normalizeProfile({})).toBeNull();
    expect(normalizeProfile({ id: "x" })).toBeNull(); // no zones
    expect(normalizeProfile({ id: "", zones: {} })).toBeNull();
  });

  it("coerces unknown journal sharing values back to private", () => {
    const p = createEmptyProfile();
    const raw = JSON.parse(JSON.stringify(p));
    raw.journal = [
      { id: "a", createdAt: "2026-01-01", updatedAt: "2026-01-01", text: "kept", sharing: "full" },
      { id: "b", createdAt: "2026-01-02", updatedAt: "2026-01-02", text: "hm", sharing: "everyone" },
      { id: "c", createdAt: "2026-01-03", updatedAt: "2026-01-03", text: "old" }, // no flag at all
    ];

    const restored = normalizeProfile(raw)!;
    expect(restored.journal.map((e) => e.sharing)).toEqual([
      "full",
      "private",
      "private",
    ]);
  });

  it("repairs malformed collections rather than crashing", () => {
    const raw = JSON.parse(JSON.stringify(createEmptyProfile()));
    raw.checkIns = "not-an-array";
    raw.trustedContacts = null;

    const restored = normalizeProfile(raw)!;
    expect(restored.checkIns).toEqual([]);
    expect(restored.trustedContacts).toEqual([]);
  });
});
