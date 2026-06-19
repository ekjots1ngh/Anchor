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
    expect(prefilledMessage("Sam Rivera")).toContain("Hi Sam");
    expect(firstNameOf("Sam Rivera")).toBe("Sam");
  });

  it("only offers messaging when consent + a number are present", () => {
    expect(canMessage(contact())).toBe(true);
    expect(canMessage(contact({ consent: false }))).toBe(false);
    expect(canMessage(contact({ phone: undefined }))).toBe(false);
    expect(canMessage(contact({ phone: "   " }))).toBe(false);
  });
});
