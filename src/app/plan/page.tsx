import { PageShell } from "@/components/PageShell";
import { Card } from "@/components/Card";
import { sampleProfile } from "@/lib/store";

export default function PlanPage() {
  const { plan } = sampleProfile;

  return (
    <PageShell
      title="Your staying-well plan"
      intro="This is your plan, in your words, authored with your care team. Anchor only ever mirrors it back to you — it never decides anything about your care."
    >
      <Card>
        <p className="text-sm font-medium text-ink-faint">Placeholder route</p>
        <h2 className="mt-2 text-xl font-semibold">What helps you stay steady</h2>
        <ul className="mt-4 space-y-3 text-ink-muted">
          {plan.whatHelps.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold">People to reach out to</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-faint">
          Real humans, in the order you chose. Reaching a person is always the
          point — Anchor is only the nudge.
        </p>
        <ul className="mt-6 space-y-3">
          {plan.contacts.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-2xl border border-line px-5 py-4"
            >
              <span className="text-ink">{c.name}</span>
              <span className="text-sm text-ink-faint">{c.relationship}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold">Your data</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Everything here belongs to you. When this is built you&rsquo;ll be
          able to export or permanently erase it at any time, no questions
          asked.
        </p>
      </Card>
    </PageShell>
  );
}
