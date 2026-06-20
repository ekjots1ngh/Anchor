"use client";

import { telHref } from "@/lib/contact";
import { useProfile } from "@/lib/useProfile";

/**
 * A quiet, ALWAYS-available way to reach the person's crisis line — present on
 * every page once onboarded, in every zone. Dismissing an amber nudge can never
 * remove this: the crisis path is always one tap away.
 */
export function CrisisQuickLink() {
  const { profile } = useProfile();
  const plan = profile?.crisisPlan;
  if (!profile?.onboardedAt || !plan?.crisisLinePhone) return null;

  return (
    <p className="mt-4 text-sm leading-relaxed text-ink-faint">
      Need someone now?{" "}
      <a
        href={telHref(plan.crisisLinePhone)}
        className="font-medium text-crisis-700 underline underline-offset-2"
      >
        Call {plan.crisisLineName} · {plan.crisisLinePhone}
      </a>
    </p>
  );
}
