"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearProfile, saveProfile } from "@/lib/store";
import { dippedProfile, seededProfile } from "@/lib/demo";

/**
 * Dev/stage-only demo tools. Two modes:
 *
 *  1. PRESENTER — a clean, scripted 2-minute walkthrough that takes a judge from
 *     steady → drifting → the warm amber message → connecting to a human, one tap
 *     per beat. The seed is pre-loaded on start, so nothing depends on live typing.
 *  2. MANUAL — the original seed / tip / reset buttons for ad-hoc demos.
 *
 * It lives in the root layout, so its state persists across navigation. Visible
 * only when NODE_ENV !== "production" or NEXT_PUBLIC_DEMO_MODE="1".
 */
const DEMO_ENABLED =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_DEMO_MODE === "1";

type Router = ReturnType<typeof useRouter>;

interface ScriptStep {
  title: string;
  caption: string;
  run: (router: Router) => void;
}

/** Smooth-scroll to a card and give it a brief highlight ring. */
function focusCard(id: string) {
  setTimeout(() => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.classList.add("ring-2", "ring-steady-500");
    setTimeout(() => el.classList.remove("ring-2", "ring-steady-500"), 2600);
  }, 450);
}

const SCRIPT: ScriptStep[] = [
  {
    title: "Steady",
    caption:
      "Meet Alex — they set Anchor up on a good day: their own early-warning signs, in their own words. Right now, they're steady.",
    run: (r) => {
      saveProfile(seededProfile());
      r.push("/dashboard");
    },
  },
  {
    title: "Drifting",
    caption:
      "A few rough days — sleep slips and Alex pulls back from people. Anchor has learned their personal baseline, and notices the drift from their own normal.",
    run: (r) => {
      saveProfile(dippedProfile());
      r.push("/dashboard");
    },
  },
  {
    title: "A warm, honest nudge",
    caption:
      "The zone comes from a transparent rule — never an AI. A model only phrases a calm, non-alarming note: it names what's drifting and points back to what helps.",
    run: (r) => {
      r.push("/dashboard");
      focusCard("present-status");
    },
  },
  {
    title: "Reach a real person",
    caption:
      "Anchor's job now is to connect Alex to a human — one tap, pre-filled, consent-gated. It's the nudge, not the help itself.",
    run: (r) => {
      r.push("/dashboard");
      focusCard("present-reach");
    },
  },
];

export function DemoPanel() {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [presenting, setPresenting] = useState(false);
  const [step, setStep] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!presenting || startedAt == null) return;
    const id = setInterval(
      () => setElapsed(Math.floor((Date.now() - startedAt) / 1000)),
      500,
    );
    return () => clearInterval(id);
  }, [presenting, startedAt]);

  if (!DEMO_ENABLED) return null;

  const goToStep = (i: number) => {
    setStep(i);
    SCRIPT[i].run(router);
  };

  const startWalkthrough = () => {
    setPresenting(true);
    setStartedAt(Date.now());
    setElapsed(0);
    goToStep(0);
  };

  const exitWalkthrough = () => {
    setPresenting(false);
    setStartedAt(null);
  };

  const goDashboard = () => {
    if (window.location.pathname !== "/dashboard") router.push("/dashboard");
  };
  const seed = () => {
    saveProfile(seededProfile());
    goDashboard();
  };
  const tip = () => {
    saveProfile(dippedProfile());
    goDashboard();
  };
  const reset = () => {
    clearProfile();
    router.push("/");
  };

  /* ---------------- Presenter bar ---------------- */
  if (presenting) {
    const s = SCRIPT[step];
    const mm = Math.floor(elapsed / 60);
    const ss = String(elapsed % 60).padStart(2, "0");
    const over = elapsed > 120;
    return (
      <div className="fixed inset-x-0 bottom-0 z-50">
        <div className="mx-auto max-w-content px-3 pb-3 sm:px-6 sm:pb-4">
          <div className="rounded-card border border-line bg-surface/95 p-4 shadow-card backdrop-blur sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Presenter · {step + 1}/{SCRIPT.length} · {s.title}
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <span
                  className={`text-xs tabular-nums ${over ? "font-semibold text-checkin-700" : "text-ink-faint"}`}
                >
                  {mm}:{ss}
                </span>
                <button
                  type="button"
                  onClick={exitWalkthrough}
                  className="rounded-pill px-3 py-1.5 text-sm text-ink-faint hover:bg-canvas"
                >
                  Exit
                </button>
              </span>
            </div>

            <p
              className="mt-2 text-base leading-relaxed text-ink sm:text-lg"
              aria-live="polite"
            >
              {s.caption}
            </p>

            <div className="mt-3 flex gap-1.5">
              {SCRIPT.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 flex-1 rounded-pill ${i <= step ? "bg-steady-500" : "bg-line"}`}
                />
              ))}
            </div>

            <div className="mt-3 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => goToStep(Math.max(0, step - 1))}
                disabled={step === 0}
                className="rounded-pill px-4 py-2 text-sm font-medium text-ink-muted hover:bg-steady-50 disabled:invisible"
              >
                Back
              </button>
              {step < SCRIPT.length - 1 ? (
                <button
                  type="button"
                  onClick={() => goToStep(step + 1)}
                  className="rounded-pill bg-steady-600 px-6 py-2.5 text-base font-semibold text-white hover:bg-steady-700"
                >
                  Next ▸
                </button>
              ) : (
                <button
                  type="button"
                  onClick={exitWalkthrough}
                  className="rounded-pill bg-steady-600 px-6 py-2.5 text-base font-semibold text-white hover:bg-steady-700"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- Collapsed pill ---------------- */
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

  /* ---------------- Manual panel ---------------- */
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

      <button
        type="button"
        onClick={startWalkthrough}
        className="mt-3 w-full rounded-pill bg-steady-600 px-4 py-3 text-base font-semibold text-white hover:bg-steady-700"
      >
        ▶ Run 2-min walkthrough
      </button>
      <p className="mt-2 text-xs leading-relaxed text-ink-faint">
        Scripted: steady → drifting → warm message → reach a human. Seed loads on
        start — no typing needed.
      </p>

      <div className="my-3 border-t border-line" />

      <p className="text-xs font-medium text-ink-faint">Or do it by hand</p>
      <div className="mt-2 space-y-2">
        <button
          type="button"
          onClick={seed}
          className="w-full rounded-pill border border-steady-300 px-4 py-2 text-sm font-medium text-steady-700 hover:bg-steady-50"
        >
          Seed steady week
        </button>
        <button
          type="button"
          onClick={tip}
          className="w-full rounded-pill border border-steady-300 px-4 py-2 text-sm font-medium text-steady-700 hover:bg-steady-50"
        >
          Tip to amber
        </button>
        <button
          type="button"
          onClick={reset}
          className="w-full rounded-pill px-4 py-2 text-sm text-ink-faint hover:bg-canvas"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
