import { describe, expect, it } from "vitest";
import { canSupporterAccess, supporterSummary } from "@/lib/supporter";
import { createEmptyProfile } from "@/lib/store";
import type { CheckIn, Profile } from "@/lib/types";

/** A profile stuffed with distinctive PRIVATE strings, then onboarded + shared. */
function privateProfile(): Profile {
  const p = createEmptyProfile();
  p.onboardedAt = new Date().toISOString();
  p.displayName = "Alex SECRETSURNAME";
  p.signs = [
    {
      id: "s1",
      name: "SECRET_SIGN_NAME",
      category: "sleep",
      description: "SECRET_SIGN_DESCRIPTION",
      source: "custom",
    },
    {
      id: "s2",
      name: "SECRET_SOCIAL_SIGN",
      category: "social",
      description: "SECRET_SOCIAL_DESC",
      source: "custom",
    },
  ];
  p.baseline.description = "SECRET_BASELINE_TEXT";
  p.stayingWellActions = [{ id: "a1", text: "SECRET_STAYING_WELL" }];
  p.trustedContacts = [
    {
      id: "c1",
      name: "SECRET_CONTACT_NAME",
      relationship: "SECRET_REL",
      phone: "SECRET_PHONE",
      alertAtZone: "amber",
      consent: true,
      visibility: "nudge",
    },
  ];
  p.crisisPlan = {
    crisisLineName: "SECRET_CRISIS_NAME",
    crisisLinePhone: "SECRET_CRISIS_PHONE",
    notes: "SECRET_CRISIS_NOTES",
  };
  const ci = (n: number, present: string[], note?: string): CheckIn => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - n);
    return {
      id: `c${n}`,
      createdAt: d.toISOString(),
      sleep: "good",
      mood: 4,
      answers: present.map((signId) => ({ signId, present: true, note })),
    };
  };
  p.checkIns = Array.from({ length: 6 }, (_, k) => ci(5 - k, []));
  // A check-in carrying a private note.
  p.checkIns.push(ci(0, ["s1"], "SECRET_CHECKIN_NOTE"));
  p.sharing = {
    ...p.sharing,
    enabled: true,
    token: "good-token",
    supporterName: "Mum",
    includeTrends: true,
    includeDriftAreas: true,
  };
  return p;
}

const PRIVATE_STRINGS = [
  "SECRETSURNAME",
  "SECRET_SIGN_NAME",
  "SECRET_SIGN_DESCRIPTION",
  "SECRET_SOCIAL_SIGN",
  "SECRET_SOCIAL_DESC",
  "SECRET_BASELINE_TEXT",
  "SECRET_STAYING_WELL",
  "SECRET_CONTACT_NAME",
  "SECRET_REL",
  "SECRET_PHONE",
  "SECRET_CRISIS_NAME",
  "SECRET_CRISIS_PHONE",
  "SECRET_CRISIS_NOTES",
  "SECRET_CHECKIN_NOTE",
];

describe("supporter access gating", () => {
  it("allows only an enabled share with the matching token", () => {
    const p = privateProfile();
    expect(canSupporterAccess(p, "good-token")).toBe(true);
    expect(canSupporterAccess(p, "wrong-token")).toBe(false);
    expect(canSupporterAccess(p, null)).toBe(false);
  });

  it("denies access once revoked (disabled)", () => {
    const p = privateProfile();
    p.sharing.enabled = false;
    expect(canSupporterAccess(p, "good-token")).toBe(false);
  });

  it("denies a profile that hasn't onboarded", () => {
    const p = privateProfile();
    p.onboardedAt = null;
    expect(canSupporterAccess(p, "good-token")).toBe(false);
  });
});

describe("supporter projection", () => {
  it("never leaks any raw private notes, names, or details", () => {
    const serialized = JSON.stringify(supporterSummary(privateProfile()));
    for (const secret of PRIVATE_STRINGS) {
      expect(serialized).not.toContain(secret);
    }
  });

  it("shares zone, trend and generic drift areas only", () => {
    const view = supporterSummary(privateProfile());
    expect(view.firstName).toBe("Alex"); // first name only
    expect(["green", "amber", "red"]).toContain(view.currentZone);
    expect(view.trend.length).toBe(14); // 14-day zone history
    // Drift areas use generic engine labels, not the person's sign names.
    for (const a of view.driftAreas) {
      expect(["steady", "some", "elevated"]).toContain(a.level);
      expect(a.label).not.toContain("SECRET");
    }
  });

  it("honours the include toggles", () => {
    const p = privateProfile();
    p.sharing.includeTrends = false;
    p.sharing.includeDriftAreas = false;
    const view = supporterSummary(p);
    expect(view.trend).toEqual([]);
    expect(view.driftAreas).toEqual([]);
  });
});
