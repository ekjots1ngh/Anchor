"use client";

import Link from "next/link";
import { telHref } from "@/lib/contact";
import { useProfile } from "@/lib/useProfile";

/**
 * A calm, always-available way to reach real support — present on every screen
 * once onboarded, in every zone. It is deliberately quiet: a steady hand, not an
 * emergency button. Dismissing an amber nudge can never remove it.
 *
 *  - <ReachSupport />     the soft footer block (anchor target #reach-support)
 *  - <ReachSupportLink /> a small header link that brings it into view
 */

function useSupport() {
  const { profile } = useProfile();
  const onboarded = !!profile?.onboardedAt;
  const phone = profile?.crisisPlan?.crisisLinePhone?.trim();
  const lineName = profile?.crisisPlan?.crisisLineName?.trim();
  const hasCircle = !!profile?.trustedContacts?.some((c) => c.consent);
  return { onboarded, phone, lineName, hasCircle };
}

export function ReachSupportLink() {
  const { onboarded } = useSupport();
  if (!onboarded) return null;
  return (
    <a
      href="#reach-support"
      className="inline-flex min-h-[2.75rem] items-center rounded-pill border border-accent/30 bg-accent-soft px-4 py-2 text-sm font-medium text-accent-text hover:bg-accent-soft"
    >
      Reach someone
    </a>
  );
}

export function ReachSupport() {
  const { onboarded, phone, lineName, hasCircle } = useSupport();
  if (!onboarded) return null;

  return (
    <section
      id="reach-support"
      aria-label="Reach someone"
      className="mt-6 rounded-2xl border border-line bg-surface px-5 py-4"
    >
      <h2 className="text-sm font-medium text-ink">Reach someone, any time</h2>
      <p className="mt-1 text-sm leading-relaxed text-ink-muted">
        Support is here whenever you want it, in any zone. No alarm, no rush.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {hasCircle ? (
          <Link
            href="/plan#circle"
            className="inline-flex min-h-[2.75rem] items-center rounded-pill border border-accent/40 px-5 py-2.5 text-sm font-medium text-accent-text hover:bg-accent-soft"
          >
            Message someone you trust
          </Link>
        ) : null}
        {phone ? (
          <a
            href={telHref(phone)}
            className="inline-flex min-h-[2.75rem] items-center rounded-pill border border-crisis-border px-5 py-2.5 text-sm font-medium text-crisis-text hover:bg-crisis-soft"
          >
            Call {lineName || "your crisis line"}
          </a>
        ) : null}
      </div>
    </section>
  );
}
