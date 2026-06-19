import { PageShell } from "@/components/PageShell";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

export default function OnboardingPage() {
  return (
    <PageShell
      title="Let's set up your Anchor"
      intro="Onboarding is where you — ideally alongside someone on your care team — choose the early-warning signs you want Anchor to watch for, in your own words, and agree on the threshold that means 'worth a check-in'. Nothing here is decided for you."
    >
      <Card>
        <p className="text-sm font-medium text-ink-faint">Placeholder route</p>
        <h2 className="mt-2 text-xl font-semibold">What onboarding will collect</h2>
        <ul className="mt-4 space-y-3 text-ink-muted">
          <li>• Your personal early-warning signs, in your words.</li>
          <li>• The weight you and your care team agree each sign carries.</li>
          <li>• The people you&rsquo;d want to reach out to, in priority order.</li>
          <li>• What helps you stay steady.</li>
        </ul>
        <p className="mt-6 text-sm leading-relaxed text-ink-faint">
          Anchor stores this for you and only you. It is not a clinical
          assessment and makes no medical claims.
        </p>
        <div className="mt-8">
          <Button href="/checkin">Continue to a check-in</Button>
        </div>
      </Card>
    </PageShell>
  );
}
