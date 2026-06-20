"use client";

import { useState } from "react";
import { signalStatus } from "@/lib/dashboard";
import { explainZone } from "@/lib/explain";
import type { ZoneComputation } from "@/lib/zone";

/**
 * The tap-to-open "Why this zone?" explanation. Everything shown comes straight
 * from the rules engine via explainZone() — plain language, no data dump, no LLM.
 */
export function WhyThisZone({
  result,
  zoneLabel,
}: {
  result: ZoneComputation;
  zoneLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const ex = explainZone(result, zoneLabel);

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="why-this-zone"
        className="-mx-3 inline-flex items-center gap-2 rounded-pill px-3 py-2 text-sm font-medium text-ink-muted hover:bg-steady-50"
      >
        <span>Why this zone?</span>
        <span
          aria-hidden
          className={`transition-transform ${open ? "rotate-90" : ""}`}
        >
          ›
        </span>
      </button>

      {open && (
        <div
          id="why-this-zone"
          className="mt-3 space-y-4 border-t border-line pt-4"
        >
          <p className="text-ink">{ex.lead}</p>

          <ul className="space-y-3">
            {ex.signals.map((s) => {
              const status = signalStatus(s.drift);
              return (
                <li key={s.label}>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-ink">
                      <span className="font-medium">{s.label}</span> {s.phrase}
                      {s.sharePhrase ? `, ${s.sharePhrase}` : ""}.
                    </span>
                    <span
                      className={`mt-0.5 shrink-0 rounded-pill px-3 py-1 text-xs font-medium ${status.pill}`}
                    >
                      {status.label}
                    </span>
                  </div>
                  <div
                    className="mt-2 h-1.5 w-full overflow-hidden rounded-pill bg-canvas"
                    aria-hidden
                  >
                    <div
                      className={`h-full rounded-pill ${status.bar}`}
                      style={{ width: `${Math.max(4, Math.round(s.drift * 100))}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          <p className="text-sm leading-relaxed text-ink-muted">{ex.ruleLine}</p>
          <p className="text-sm leading-relaxed text-ink-faint">{ex.reassurance}</p>
        </div>
      )}
    </div>
  );
}
