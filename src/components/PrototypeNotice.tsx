/**
 * A clear, visible note that Anchor is an unvalidated prototype, not a medical
 * device. Shown wherever the framework-grounded signs are presented.
 */
export function PrototypeNotice({ className = "" }: { className?: string }) {
  return (
    <div
      role="note"
      className={`rounded-2xl border border-checkin-200 bg-checkin-50 p-4 text-sm leading-relaxed text-ink sm:p-5 ${className}`}
    >
      <p className="font-semibold">A prototype — not a medical device.</p>
      <p className="mt-1 text-ink-muted">
        Anchor is an early, unvalidated prototype. These early-warning signs are
        starting points drawn from staying-well and relapse-prevention frameworks
        (such as WRAP) — they aren&rsquo;t a checklist or a diagnosis. Make them
        your own, ideally with your care team. Anchor supports professional care;
        it never replaces it.
      </p>
    </div>
  );
}
