import type { ContactVisibility, TrustedContact } from "@/lib/types";

/**
 * Helpers for reaching a real person fast.
 *
 * In amber/red, Anchor's job is to connect the person to a human — so these
 * build one-tap `tel:` / `sms:` links the device opens directly. The SMS body
 * is PRE-FILLED but always opens in the person's own messaging app, so they
 * read and send it themselves — Anchor never sends anything on their behalf.
 */

const stripPhone = (phone: string): string => phone.replace(/\s+/g, "");

export function telHref(phone: string): string {
  return `tel:${stripPhone(phone)}`;
}

/**
 * `sms:NUMBER?&body=…` — the `?&` form is the most cross-platform way to
 * pre-fill a body on both iOS and Android.
 */
export function smsHref(phone: string, body: string): string {
  return `sms:${stripPhone(phone)}?&body=${encodeURIComponent(body)}`;
}

/** First name only, for friendly button labels ("Message Sam"). */
export function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/**
 * A warm, non-alarming pre-filled message in the person's own voice. It only
 * reveals what the contact's `visibility` setting allows — and only when that
 * information is actually available (e.g. a live zone). The person edits and
 * sends it themselves; Anchor never sends anything.
 */
export function prefilledMessage(opts: {
  contactName?: string;
  visibility?: ContactVisibility;
  zoneLabel?: string;
  signalLabels?: string[];
}): string {
  const greeting = opts.contactName ? `Hi ${firstNameOf(opts.contactName)}` : "Hi";
  const visibility = opts.visibility ?? "nudge";

  const extras: string[] = [];
  if ((visibility === "zone" || visibility === "signals") && opts.zoneLabel) {
    extras.push(`Right now I'd say I'm in a "${opts.zoneLabel}" patch.`);
  }
  if (visibility === "signals" && opts.signalLabels && opts.signalLabels.length) {
    extras.push(`A few of my signs are showing — ${joinList(opts.signalLabels)}.`);
  }

  const opener = `${greeting} — I'm checking in with my Anchor and I could use a bit of support.`;
  const closer = "Are you free to talk soon?";
  return extras.length
    ? `${opener} ${extras.join(" ")} ${closer}`
    : `${opener} ${closer}`;
}

/**
 * Whether we can offer one-tap messaging for a contact: they must have agreed
 * to be reached (consent) and have a number saved.
 */
export function canMessage(contact: TrustedContact): boolean {
  return contact.consent && !!contact.phone?.trim();
}
