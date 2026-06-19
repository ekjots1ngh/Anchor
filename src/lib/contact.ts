import type { TrustedContact } from "@/lib/types";

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

/**
 * A warm, non-alarming pre-filled message, written in the person's own voice,
 * to a chosen contact. They can edit it before sending.
 */
export function prefilledMessage(contactName?: string): string {
  const greeting = contactName ? `Hi ${firstNameOf(contactName)}` : "Hi";
  return `${greeting} — I'm checking in with my Anchor and a few of the things I keep an eye on are showing. I could use a bit of support. Are you free to talk soon?`;
}

/**
 * Whether we can offer one-tap messaging for a contact: they must have agreed
 * to be reached (consent) and have a number saved.
 */
export function canMessage(contact: TrustedContact): boolean {
  return contact.consent && !!contact.phone?.trim();
}
