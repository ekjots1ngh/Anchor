import {
  canMessage,
  firstNameOf,
  prefilledMessage,
  smsHref,
  telHref,
} from "@/lib/contact";
import type { TrustedContact } from "@/lib/types";

/**
 * One-tap ways to reach a single trusted contact. Consent-gated: if the person
 * hasn't confirmed the contact agreed to be reached, no messaging is offered.
 * The Message button pre-fills a warm note but opens the device's own SMS app —
 * the person sends it themselves.
 */
export function ContactActions({ contact }: { contact: TrustedContact }) {
  if (!contact.consent) {
    return (
      <p className="text-sm text-ink-faint">
        Consent not confirmed — add {firstNameOf(contact.name)} again in your plan to enable messaging.
      </p>
    );
  }

  if (!canMessage(contact)) {
    return (
      <p className="text-sm text-ink-faint">
        No number saved for {firstNameOf(contact.name)} — add one in your plan.
      </p>
    );
  }

  const phone = contact.phone as string;

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={smsHref(phone, prefilledMessage(contact.name))}
        className="inline-flex min-h-[2.75rem] items-center justify-center rounded-pill bg-steady-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-steady-700"
      >
        Message {firstNameOf(contact.name)}
      </a>
      <a
        href={telHref(phone)}
        className="inline-flex min-h-[2.75rem] items-center justify-center rounded-pill border border-steady-300 px-5 py-2.5 text-sm font-medium text-steady-700 hover:bg-steady-50"
      >
        Call
      </a>
    </div>
  );
}
