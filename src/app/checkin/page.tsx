import { PageShell } from "@/components/PageShell";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { sampleProfile } from "@/lib/store";

export default function CheckInPage() {
  const { signs } = sampleProfile;

  return (
    <PageShell
      title="A quick check-in"
      intro="A check-in is just you noticing which of your own signs are around today. There are no right answers and nothing is scored against you — Anchor only reflects your picture back."
    >
      <Card>
        <p className="text-sm font-medium text-ink-faint">Placeholder route</p>
        <h2 className="mt-2 text-xl font-semibold">
          Are any of these around for you today?
        </h2>
        <ul className="mt-6 space-y-3">
          {signs.map((sign) => (
            <li
              key={sign.id}
              className="flex items-center justify-between rounded-2xl border border-line bg-steady-50/40 px-5 py-4"
            >
              <span className="text-ink">{sign.label}</span>
              <span className="text-sm text-ink-faint">not wired yet</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm leading-relaxed text-ink-faint">
          When this is built, your answers run through a transparent rules
          engine — never an AI — to decide which zone you&rsquo;re in.
        </p>
        <div className="mt-8">
          <Button href="/dashboard">See my dashboard</Button>
        </div>
      </Card>
    </PageShell>
  );
}
