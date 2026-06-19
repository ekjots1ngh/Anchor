"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clearProfile, saveProfile } from "@/lib/store";
import { dippedProfile, seededProfile } from "@/lib/demo";

/**
 * Dev/stage-only demo panel.
 *
 * Visible only when NODE_ENV !== "production" (i.e. `npm run dev`), or when
 * NEXT_PUBLIC_DEMO_MODE="1" is set (so a Vercel *preview* can opt in). It never
 * appears in a normal production build.
 *
 * Stage flow:
 *   1. "Seed steady week"  → 7 calm days; the dashboard sits green.
 *   2. "Tip to amber"      → injects 3 dipping days (sleep + social); the
 *      dashboard tips to amber live (no reload — useProfile re-reads on the
 *      store-changed event) and the LLM note generates on screen.
 *   3. "Reset"             → wipes the demo data.
 */
const DEMO_ENABLED =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_DEMO_MODE === "1";

export function DemoPanel() {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  if (!DEMO_ENABLED) return null;

  const goToDashboard = () => {
    if (window.location.pathname !== "/dashboard") router.push("/dashboard");
  };

  const seed = () => {
    saveProfile(seededProfile());
    goToDashboard();
  };

  const tip = () => {
    saveProfile(dippedProfile()); // robust even if "seed" wasn't pressed first
    goToDashboard();
  };

  const reset = () => {
    clearProfile();
    router.push("/");
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 rounded-pill border border-line bg-surface/95 px-4 py-2 text-sm font-medium text-ink-muted shadow-card backdrop-blur"
      >
        Demo
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-64 rounded-card border border-line bg-surface/95 p-4 shadow-card backdrop-blur">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
          Demo mode · dev only
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-ink-faint hover:text-ink-muted"
          aria-label="Hide demo panel"
        >
          ×
        </button>
      </div>

      <div className="mt-3 space-y-2">
        <button
          type="button"
          onClick={seed}
          className="w-full rounded-pill border border-steady-300 px-4 py-2.5 text-sm font-medium text-steady-700 hover:bg-steady-50"
        >
          1 · Seed steady week
        </button>

        {/* The one stage button. */}
        <button
          type="button"
          onClick={tip}
          className="w-full rounded-pill bg-checkin-600 px-4 py-3 text-base font-semibold text-white hover:bg-checkin-700"
        >
          2 · Tip to amber ▸
        </button>

        <button
          type="button"
          onClick={reset}
          className="w-full rounded-pill px-4 py-2 text-sm text-ink-faint hover:bg-canvas"
        >
          Reset
        </button>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-ink-faint">
        Seeds 7 calm days, then injects 3 days of dipping sleep + social to tip
        the dashboard green → amber live.
      </p>
    </div>
  );
}
