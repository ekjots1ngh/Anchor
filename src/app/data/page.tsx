"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { Card } from "@/components/Card";
import { SupporterAccess } from "@/components/SupporterAccess";
import { useProfile } from "@/lib/useProfile";
import { clearProfile, saveProfile } from "@/lib/store";
import {
  CONTACT_VISIBILITY_LABELS,
  type ContactVisibility,
  type TrustedContact,
  type ZoneId,
} from "@/lib/types";

const selectCls =
  "w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-steady-300";

export default function DataPage() {
  const router = useRouter();
  const { profile, loading } = useProfile();

  if (loading) return <PageShell title="Your data">{null}</PageShell>;

  if (!profile?.onboardedAt) {
    return (
      <PageShell
        title="Your data"
        intro="Once you've set up your Anchor, everything stored about you lives here — yours to read, export, or erase."
      >
        <Card>
          <Link
            href="/onboarding"
            className="inline-flex min-h-[2.75rem] items-center rounded-pill bg-steady-600 px-7 py-3 font-medium text-white hover:bg-steady-700"
          >
            Set up my Anchor
          </Link>
        </Card>
      </PageShell>
    );
  }

  const saved = profile.checkIns
    .map((c) => new Date(c.createdAt))
    .sort((a, b) => a.getTime() - b.getTime());
  const range =
    saved.length === 0
      ? "none yet"
      : saved.length === 1
        ? saved[0].toLocaleDateString()
        : `${saved[0].toLocaleDateString()} – ${saved[saved.length - 1].toLocaleDateString()}`;

  const updateContact = (id: string, patch: Partial<TrustedContact>) =>
    saveProfile({
      ...profile,
      trustedContacts: profile.trustedContacts.map((c) =>
        c.id === id ? { ...c, ...patch } : c,
      ),
    });

  const removeContact = (id: string) =>
    saveProfile({
      ...profile,
      trustedContacts: profile.trustedContacts.filter((c) => c.id !== id),
    });

  const exportData = () => {
    const blob = new Blob([JSON.stringify(profile, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "anchor-my-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const eraseAll = () => {
    if (
      window.confirm(
        "This permanently erases everything Anchor has stored about you, from this device. There's no undo. Continue?",
      )
    ) {
      clearProfile();
      router.push("/");
    }
  };

  return (
    <PageShell
      title="Your data"
      intro="Everything Anchor knows about you lives on this device, in your browser — it is never sent to a server. Read all of it below, take a copy, or erase it for good. And you decide exactly what each person in your circle can see."
    >
      {/* What's stored */}
      <Card>
        <h2 className="text-xl font-semibold">What&rsquo;s stored about you</h2>
        <dl className="mt-4 divide-y divide-line">
          <Row label="Name Anchor calls you" value={profile.displayName || "(not set)"} />
          <Row
            label="Early-warning signs"
            value={
              profile.signs.length
                ? profile.signs.map((s) => s.name).join(", ")
                : "none"
            }
          />
          <Row
            label="Your zones, in your words"
            value={(["green", "amber", "red"] as ZoneId[])
              .map((z) => profile.zones[z].label)
              .join(" · ")}
          />
          <Row label="Baseline" value={profile.baseline.description || "(not set)"} />
          <Row
            label="Things that help"
            value={
              profile.stayingWellActions.length
                ? profile.stayingWellActions.map((a) => a.text).join(", ")
                : "none"
            }
          />
          <Row
            label="Trusted circle"
            value={`${profile.trustedContacts.length} ${
              profile.trustedContacts.length === 1 ? "person" : "people"
            }`}
          />
          <Row
            label="Crisis line"
            value={`${profile.crisisPlan.crisisLineName} · ${profile.crisisPlan.crisisLinePhone}`}
          />
          <Row
            label="Check-ins saved"
            value={`${profile.checkIns.length} (${range})`}
          />
          <Row
            label={"“I'm actually okay” corrections"}
            value={`${(profile.corrections ?? []).length}`}
          />
          <Row
            label="Supporter access"
            value={
              profile.sharing?.enabled
                ? `On — shared with ${profile.sharing.supporterName || "someone"}`
                : "Off"
            }
          />
          <Row label="Where it lives" value="This device only — your browser's storage" />
        </dl>

        <details className="mt-5">
          <summary className="cursor-pointer rounded-pill px-3 py-2 text-sm font-medium text-ink-muted hover:bg-steady-50">
            See the raw data (JSON)
          </summary>
          <pre className="mt-3 max-h-72 overflow-auto rounded-2xl border border-line bg-canvas p-4 text-xs text-ink-muted">
            {JSON.stringify(profile, null, 2)}
          </pre>
        </details>
      </Card>

      {/* Who can see what */}
      <Card>
        <h2 className="text-xl font-semibold">Who can see what</h2>
        <p className="mt-1 text-sm leading-relaxed text-ink-muted">
          You control, per person, when they&rsquo;re reached and exactly how much
          they see. These settings shape what a pre-filled message reveals —
          nothing more is ever shared, and only when you press send.
        </p>

        {profile.trustedContacts.length === 0 ? (
          <p className="mt-4 text-sm text-ink-faint">
            No one in your circle yet. You can add people in onboarding.
          </p>
        ) : (
          <ul className="mt-5 space-y-4">
            {profile.trustedContacts.map((c) => (
              <li key={c.id} className="rounded-2xl border border-line p-4 sm:p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <span>
                    <span className="font-medium text-ink">{c.name}</span>
                    <span className="block text-sm text-ink-faint">
                      {c.relationship}
                      {c.phone ? ` · ${c.phone}` : ""}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeContact(c.id)}
                    className="rounded-pill px-3 py-2 text-sm text-ink-faint hover:bg-canvas hover:text-ink-muted"
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-ink">Reach them from</span>
                    <select
                      className={`${selectCls} mt-2`}
                      value={c.alertAtZone}
                      onChange={(e) =>
                        updateContact(c.id, { alertAtZone: e.target.value as ZoneId })
                      }
                    >
                      <option value="green">Green — anytime</option>
                      <option value="amber">Amber — when a few signs show</option>
                      <option value="red">Red — only when I really need support</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-ink">They can see</span>
                    <select
                      className={`${selectCls} mt-2`}
                      value={c.visibility ?? "nudge"}
                      onChange={(e) =>
                        updateContact(c.id, {
                          visibility: e.target.value as ContactVisibility,
                        })
                      }
                    >
                      {(Object.keys(CONTACT_VISIBILITY_LABELS) as ContactVisibility[]).map(
                        (v) => (
                          <option key={v} value={v}>
                            {CONTACT_VISIBILITY_LABELS[v]}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                </div>

                <label className="mt-4 flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={c.consent}
                    onChange={(e) => updateContact(c.id, { consent: e.target.checked })}
                    className="mt-1 h-5 w-5 rounded border-line text-steady-600 focus:ring-steady-300"
                  />
                  <span className="text-sm text-ink-muted">
                    They&rsquo;ve agreed to be part of my circle. (Without this,
                    Anchor won&rsquo;t offer to message them.)
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Consent-gated supporter access */}
      <SupporterAccess profile={profile} />

      {/* Take it or delete it */}
      <Card>
        <h2 className="text-xl font-semibold">Take it or delete it</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          It&rsquo;s your data. Download a full copy any time, or erase every
          trace of it from this device — no account, no questions, no copies kept
          anywhere else.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={exportData}
            className="inline-flex min-h-[2.75rem] items-center rounded-pill border border-steady-300 px-5 py-2.5 font-medium text-steady-700 hover:bg-steady-50"
          >
            Export my data
          </button>
          <button
            type="button"
            onClick={eraseAll}
            className="inline-flex min-h-[2.75rem] items-center rounded-pill border border-crisis-300 px-5 py-2.5 font-medium text-crisis-700 hover:bg-crisis-50"
          >
            Erase everything
          </button>
        </div>
      </Card>
    </PageShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="text-ink sm:max-w-[60%] sm:text-right">{value}</dd>
    </div>
  );
}
