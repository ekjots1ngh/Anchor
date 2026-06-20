"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { saveProfile } from "@/lib/store";
import type { Profile, SharingSettings } from "@/lib/types";

const inputCls =
  "w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink placeholder:text-ink-faint focus:outline-none focus-visible:ring-2 focus-visible:ring-steady-300";

/**
 * The person's control panel for consent-gated supporter access. Off by
 * default. Turning it on generates a fresh token; revoking turns it off AND
 * rotates the token so any link already shared stops working.
 */
export function SupporterAccess({ profile }: { profile: Profile }) {
  const s = profile.sharing;
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => setOrigin(window.location.origin), []);

  const update = (patch: Partial<SharingSettings>) =>
    saveProfile({ ...profile, sharing: { ...profile.sharing, ...patch } });

  const grant = () =>
    update({
      enabled: true,
      token: crypto.randomUUID(),
      grantedAt: new Date().toISOString(),
    });

  const revoke = () =>
    // Rotate the token so any link already shared dies immediately.
    update({ enabled: false, token: crypto.randomUUID() });

  const link = origin ? `${origin}/supporter?token=${s.token}` : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Supporter access</h2>
        <span
          className={`rounded-pill px-3 py-1 text-sm font-medium ${
            s.enabled ? "bg-steady-100 text-steady-700" : "bg-canvas text-ink-faint"
          }`}
        >
          {s.enabled ? "On" : "Off"}
        </span>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        Optionally let a family member or care coordinator see a <strong>read-only</strong>{" "}
        summary, your <strong>zones and trends only</strong>. They never see your
        private notes, your check-in details, your contacts, or your crisis plan.
        You&rsquo;re in control, and you can turn it off any time.
      </p>

      <div className="mt-5 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-ink">Who is this for?</span>
          <input
            className={`${inputCls} mt-2`}
            value={s.supporterName}
            onChange={(e) => update({ supporterName: e.target.value })}
            placeholder="e.g. Mum, or my care coordinator"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Their role</span>
          <input
            className={`${inputCls} mt-2`}
            value={s.supporterRole}
            onChange={(e) => update({ supporterRole: e.target.value })}
            placeholder="e.g. Family, Care coordinator"
          />
        </label>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-ink">What they can see</legend>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={s.includeTrends}
              onChange={(e) => update({ includeTrends: e.target.checked })}
              className="mt-1 h-5 w-5 rounded border-line text-steady-600 focus:ring-steady-300"
            />
            <span className="text-sm text-ink-muted">
              Recent zone history (the last 14 days), not just today.
            </span>
          </label>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={s.includeDriftAreas}
              onChange={(e) => update({ includeDriftAreas: e.target.checked })}
              className="mt-1 h-5 w-5 rounded border-line text-steady-600 focus:ring-steady-300"
            />
            <span className="text-sm text-ink-muted">
              Which broad areas are drifting (e.g. &ldquo;Sleep&rdquo;,
              &ldquo;Connection&rdquo;), generic labels only, never your wording.
            </span>
          </label>
        </fieldset>
      </div>

      {s.enabled ? (
        <div className="mt-6 space-y-4 rounded-2xl border border-steady-200 bg-steady-50/50 p-4">
          <p className="text-sm font-medium text-steady-700">
            Sharing is on{s.supporterName ? ` with ${s.supporterName}` : ""}. Send
            them this private link:
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input readOnly value={link} className={`${inputCls} font-mono text-xs`} />
            <button
              type="button"
              onClick={copy}
              className="inline-flex min-h-[2.75rem] items-center justify-center rounded-pill bg-steady-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-steady-700"
            >
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={link || "#"}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[2.75rem] items-center rounded-pill border border-steady-300 px-5 py-2.5 text-sm font-medium text-steady-700 hover:bg-steady-50"
            >
              Preview what they see
            </a>
            <button
              type="button"
              onClick={revoke}
              className="inline-flex min-h-[2.75rem] items-center rounded-pill border border-crisis-300 px-5 py-2.5 text-sm font-medium text-crisis-700 hover:bg-crisis-50"
            >
              Turn off access
            </button>
          </div>
          <p className="text-xs leading-relaxed text-ink-faint">
            Turning off access also invalidates the link above, so anyone you sent it
            to can no longer open it.
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={grant}
          className="mt-6 inline-flex min-h-[2.75rem] items-center rounded-pill bg-steady-600 px-6 py-3 font-medium text-white hover:bg-steady-700"
        >
          Turn on supporter access
        </button>
      )}

      <p className="mt-5 text-xs leading-relaxed text-ink-faint">
        Prototype note: the summary is read from this device, so the preview link
        works in this browser. A hosted version (the planned Supabase backend)
        would let your supporter open it from anywhere, and the read-only projection
        and your control over it stay exactly the same.
      </p>
    </Card>
  );
}
