import { PageShell } from "@/components/PageShell";
import { Card } from "@/components/Card";
import { ZoneBadge } from "@/components/ZoneBadge";
import { ZONES } from "@/design/tokens";
import { evaluateZone } from "@/lib/rules-engine";
import { sampleProfile } from "@/lib/store";
import type { CheckIn } from "@/lib/types";

/**
 * Demo check-in so the scaffolded dashboard renders a real, deterministic
 * result. In the built app this comes from the person's latest check-in.
 */
const demoCheckIn: CheckIn = {
  id: "demo",
  createdAt: new Date("2026-06-19").toISOString(),
  answers: [
    { signId: "sleep", present: true },
    { signId: "withdraw", present: false },
    { signId: "noise", present: false },
    { signId: "skip-meds", present: false },
  ],
};

export default function DashboardPage() {
  // The zone comes ENTIRELY from the transparent rules engine.
  const result = evaluateZone({
    signs: sampleProfile.signs,
    checkIn: demoCheckIn,
    threshold: sampleProfile.plan.checkinThreshold,
  });
  const token = ZONES[result.zone];

  return (
    <PageShell
      title="Your dashboard"
      intro="A calm summary of where things are, based only on your own signs. The reasons behind the zone are always shown in full — nothing is hidden."
    >
      <Card className={token.classes.softBg}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-ink-faint">Placeholder route</p>
          <ZoneBadge zone={result.zone} />
        </div>
        <p className="mt-4 text-lg leading-relaxed text-ink">{result.message}</p>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold">Why this zone?</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-faint">
          Score {result.score} of a threshold of {result.threshold}. Decided by
          the rules engine, not an AI. Every input is listed below.
        </p>
        <ul className="mt-6 space-y-3">
          {result.reasons.map((r) => (
            <li
              key={r.signId}
              className="flex items-center justify-between rounded-2xl border border-line px-5 py-4"
            >
              <span className={r.present ? "text-ink" : "text-ink-faint"}>
                {r.signLabel}
              </span>
              <span className="text-sm text-ink-faint">
                {r.present ? `present · +${r.contribution}` : "not present · +0"}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </PageShell>
  );
}
