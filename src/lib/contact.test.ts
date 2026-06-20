import { describe, expect, it } from "vitest";
import {
  canMessage,
  firstNameOf,
  prefilledMessage,
  smsHref,
  telHref,
} from "@/lib/contact";
import type { TrustedContact } from "@/lib/types";

const contact = (over: Partial<TrustedContact> = {}): TrustedContact => ({
  id: "c1",
  name: "Sam Rivera",
  relationship: "Close friend",
  phone: "07700 900 123",
  alertAtZone: "amber",
  consent: true,
  visibility: "nudge",
  ...over,
});

describe("contact helpers", () => {
  it("strips spaces from tel/sms numbers", () => {
    expect(telHref("07700 900 123")).toBe("tel:07700900123");
    expect(smsHref("07700 900 123", "hi")).toMatch(/^sms:07700900123\?&body=/);
  });

  it("url-encodes the pre-filled body", () => {
    const href = smsHref("123", "Hi Sam — I could use support");
    expect(href).toContain(encodeURIComponent("Hi Sam — I could use support"));
    expect(href).not.toContain(" ");
  });

  it("greets the contact by first name", () => {
    expect(prefilledMessage({ contactName: "Sam Rivera" })).toContain("Hi Sam");
    expect(firstNameOf("Sam Rivera")).toBe("Sam");
  });

  it("only reveals what the contact's visibility allows", () => {
    const ctx = { zoneLabel: "Drifting", signalLabels: ["Sleep", "Social withdrawal"] };

    const nudge = prefilledMessage({ contactName: "Sam", visibility: "nudge", ...ctx });
    expect(nudge).not.toContain("Drifting");
    expect(nudge).not.toContain("Sleep");

    const zone = prefilledMessage({ contactName: "Sam", visibility: "zone", ...ctx });
    expect(zone).toContain("Drifting");
    expect(zone).not.toContain("Sleep");

    const signals = prefilledMessage({ contactName: "Sam", visibility: "signals", ...ctx });
    expect(signals).toContain("Drifting");
    expect(signals).toContain("Sleep");
  });

  it("never reveals a zone/signals it doesn't have, even if allowed", () => {
    const msg = prefilledMessage({ contactName: "Sam", visibility: "signals" });
    expect(msg).toContain("Hi Sam");
    expect(msg).not.toMatch(/signs are showing/);
  });

  it("only offers messaging when consent + a number are present", () => {
    expect(canMessage(contact())).toBe(true);
    expect(canMessage(contact({ consent: false }))).toBe(false);
    expect(canMessage(contact({ phone: undefined }))).toBe(false);
    expect(canMessage(contact({ phone: "   " }))).toBe(false);
  });
});
