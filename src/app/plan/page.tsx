"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { Card } from "@/components/Card";
import { ZoneBadge } from "@/components/ZoneBadge";
import { useProfile } from "@/lib/useProfile";
import { clearProfile } from "@/lib/store";
import { ZONE_STYLES } from "@/design/tokens";
import type { ZoneId } from "@/lib/types";

const ZONE_ORDER: ZoneId[] = ["green", "amber", "red"];

export default function PlanPage() {
  const router = useRouter();
  const { profile, loading } = useProfile();

  if (loading) return <PageShell title="Your staying-well plan">{null}</PageShell>;

  if (!profile?.onboardedAt) {
    return (
      <PageShell
        title="Your staying-well plan"
        intro="Your plan appears here once you've set up your Anchor."
      >
        <Card>
          <Link
            href="/onboarding"
            className="rounded-pill bg-steady-400 px-7 py-3 font-medium text-white hover:bg-steady-500"
          >
            Set up my Anchor
          </Link>
        </Card>
      </PageShell>
    );
  }

  const exportData = () => {
    const blob = new Blob([JSON.stringify(profile, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "anchor-plan.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const erase = () => {
    if (
      window.confirm(
        "This permanently erases your plan from this device. There's no undo. Continue?",
      )
    ) {
      clearProfile();
      router.push("/");
    }
  };

  return (
    <PageShell
      title="Your staying-well plan"
      intro="This is your plan, in your words. Anchor only ever mirrors it back — it never decides anything about your care."
    >
      <Card>
        <h2 className="text-xl font-semibold">Your zones</h2>
        <div className="mt-4 space-y-3">
          {ZONE_ORDER.map((id) => {
            const z = profile.zones[id];
            return (
              <div
                key={id}
                className={`rounded-2xl border border-line p-4 ${ZONE_STYLES[id].softBg}`}
              >
                <ZoneBadge zone={id} label={z.label} />
                <p className="mt-2 text-sm text-ink-muted">{z.description}</p>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold">Signs you're watching</h2>
        <ul className="mt-4 space-y-2">
          {profile.signs.map((s) => (
            <li key={s.id} className="rounded-2xl border border-line px-4 py-3">
              <span className="font-medium text-ink">{s.name}</span>
              <span className="block text-sm text-ink-faint">{s.description}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold">What helps you stay steady</h2>
        <ul className="mt-4 space-y-2 text-ink-muted">
          {profile.stayingWellActions.map((a) => (
            <li key={a.id}>• {a.text}</li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold">Your trusted circle</h2>
        <ul className="mt-4 space-y-3">
          {profile.trustedContacts.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-2xl border border-line px-4 py-3"
            >
              <span>
                <span className="font-medium text-ink">{c.name}</span>
                <span className="block text-sm text-ink-faint">
                  {c.relationship}
                  {c.phone ? ` · ${c.phone}` : ""}
                </span>
              </span>
              <ZoneBadge zone={c.alertAtZone} label={profile.zones[c.alertAtZone].label} />
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold">Crisis line</h2>
        <p className="mt-3">
          <span className="font-medium text-ink">{profile.crisisPlan.crisisLineName}</span>
          {" · "}
          <a
            href={`tel:${profile.crisisPlan.crisisLinePhone}`}
            className="font-medium text-steady-700"
          >
            {profile.crisisPlan.crisisLinePhone}
          </a>
        </p>
        {profile.crisisPlan.whatHelps ? (
          <p className="mt-3 text-sm text-ink-muted">
            <span className="text-ink-faint">What helps: </span>
            {profile.crisisPlan.whatHelps}
          </p>
        ) : null}
        {profile.crisisPlan.whatToAvoid ? (
          <p className="mt-1 text-sm text-ink-muted">
            <span className="text-ink-faint">What to avoid: </span>
            {profile.crisisPlan.whatToAvoid}
          </p>
        ) : null}
        {profile.crisisPlan.notes ? (
          <p className="mt-1 text-sm text-ink-muted">
            <span className="text-ink-faint">Notes: </span>
            {profile.crisisPlan.notes}
          </p>
        ) : null}
      </Card>

      <Card>
        <h2 className="text-xl font-semibold">Your data</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Everything here belongs to you and lives only on this device. Export a
          copy or erase it entirely, any time, no questions asked.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={exportData}
            className="rounded-pill border border-steady-300 px-5 py-2.5 font-medium text-steady-700 hover:bg-steady-50"
          >
            Export my data
          </button>
          <button
            type="button"
            onClick={erase}
            className="rounded-pill border border-line px-5 py-2.5 font-medium text-ink-muted hover:bg-canvas"
          >
            Erase everything
          </button>
        </div>
      </Card>
    </PageShell>
  );
}
