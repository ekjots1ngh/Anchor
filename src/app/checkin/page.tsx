"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Card } from "@/components/Card";
import { useProfile } from "@/lib/useProfile";
import { saveProfile } from "@/lib/store";
import type {
  CheckIn,
  MoodRating,
  Profile,
  SleepQuality,
} from "@/lib/types";

/** Local YYYY-MM-DD key, so "today" means the person's day, not UTC. */
function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

const SLEEP_OPTIONS: { value: SleepQuality; label: string }[] = [
  { value: "good", label: "Good" },
  { value: "okay", label: "Okay" },
  { value: "poor", label: "Poor" },
];

const MOOD_VALUES: MoodRating[] = [1, 2, 3, 4, 5];

export default function CheckInPage() {
  const router = useRouter();
  const { profile, loading } = useProfile();

  if (loading) return <PageShell title="Your daily check-in">{null}</PageShell>;

  if (!profile?.onboardedAt) {
    return (
      <PageShell
        title="Your daily check-in"
        intro="First, let's set up your Anchor while you're feeling steady."
      >
        <Card>
          <Link
            href="/onboarding"
            className="inline-flex rounded-pill bg-steady-400 px-7 py-3 font-medium text-white hover:bg-steady-500"
          >
            Set up my Anchor
          </Link>
        </Card>
      </PageShell>
    );
  }

  return <CheckInForm profile={profile} onDone={() => router.push("/dashboard")} />;
}

function CheckInForm({
  profile,
  onDone,
}: {
  profile: Profile;
  onDone: () => void;
}) {
  const todayKey = dayKey(new Date().toISOString());
  // If they already checked in today, pre-load it so a second visit edits
  // rather than duplicates — keeps "daily" clean and low-burden.
  const existing = profile.checkIns.find((c) => dayKey(c.createdAt) === todayKey);

  // Neutral defaults: a "nothing to report" day is just two taps to save.
  const [sleep, setSleep] = useState<SleepQuality>(existing?.sleep ?? "okay");
  const [mood, setMood] = useState<MoodRating>(existing?.mood ?? 3);
  const [present, setPresent] = useState<Record<string, boolean>>(() => {
    const seed: Record<string, boolean> = {};
    existing?.answers.forEach((a) => {
      seed[a.signId] = a.present;
    });
    return seed;
  });

  const toggleSign = (id: string) =>
    setPresent((p) => ({ ...p, [id]: !p[id] }));

  const save = () => {
    const now = new Date().toISOString();
    const record: CheckIn = {
      id: existing?.id ?? crypto.randomUUID(),
      createdAt: now,
      sleep,
      mood,
      answers: profile.signs.map((s) => ({
        signId: s.id,
        present: !!present[s.id],
      })),
    };
    const checkIns = existing
      ? profile.checkIns.map((c) => (c.id === existing.id ? record : c))
      : [...profile.checkIns, record];
    saveProfile({ ...profile, checkIns });
    onDone();
  };

  const presentCount = Object.values(present).filter(Boolean).length;

  return (
    <PageShell
      title={`Your 30-second check-in${profile.displayName ? `, ${profile.displayName}` : ""}`}
      intro="Just a quick snapshot of today. There are no right answers, and nothing is scored against you — Anchor only reflects your own picture back."
    >
      {existing ? (
        <p className="-mt-2 text-sm text-ink-faint">
          You already checked in today — this will gently update it.
        </p>
      ) : null}

      {/* Sleep */}
      <Card>
        <h2 className="text-lg font-semibold">How did you sleep?</h2>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {SLEEP_OPTIONS.map((opt) => {
            const on = sleep === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSleep(opt.value)}
                aria-pressed={on}
                className={`rounded-2xl border px-4 py-4 text-center font-medium transition-colors ${
                  on
                    ? "border-steady-300 bg-steady-50 text-ink"
                    : "border-line bg-surface text-ink-muted hover:bg-steady-50/40"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Mood */}
      <Card>
        <h2 className="text-lg font-semibold">How's your mood right now?</h2>
        <div className="mt-4 flex gap-2 sm:gap-3">
          {MOOD_VALUES.map((value) => {
            const on = mood === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setMood(value)}
                aria-pressed={on}
                aria-label={`Mood ${value} of 5`}
                className={`flex h-14 flex-1 items-center justify-center rounded-2xl border text-lg font-medium tabular-nums transition-colors ${
                  on
                    ? "border-checkin-300 bg-checkin-50 text-ink"
                    : "border-line bg-surface text-ink-muted hover:bg-steady-50/40"
                }`}
              >
                {value}
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-sm text-ink-faint">
          <span>Low</span>
          <span>Good</span>
        </div>
      </Card>

      {/* Top personal signs */}
      <Card>
        <h2 className="text-lg font-semibold">Any of your signs showing today?</h2>
        <p className="mt-1 text-sm text-ink-faint">
          Tap any that are around. Leave the rest — most days, that&rsquo;s none.
        </p>
        <ul className="mt-4 space-y-2">
          {profile.signs.map((s) => {
            const on = !!present[s.id];
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => toggleSign(s.id)}
                  aria-pressed={on}
                  className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-5 py-3 text-left transition-colors ${
                    on
                      ? "border-checkin-300 bg-checkin-50"
                      : "border-line bg-surface hover:bg-steady-50/40"
                  }`}
                >
                  <span className="font-medium text-ink">{s.name}</span>
                  <span
                    className={`shrink-0 rounded-pill px-3 py-1 text-sm font-medium ${
                      on
                        ? "bg-checkin-100 text-checkin-700"
                        : "bg-canvas text-ink-faint"
                    }`}
                  >
                    {on ? "Yes" : "No"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="flex items-center justify-between">
        <span className="text-sm text-ink-faint">
          {presentCount === 0
            ? "Nothing showing today."
            : `${presentCount} ${presentCount === 1 ? "sign" : "signs"} marked.`}
        </span>
        <button
          type="button"
          onClick={save}
          className="rounded-pill bg-steady-400 px-7 py-3 font-medium text-white hover:bg-steady-500"
        >
          Save today&rsquo;s check-in
        </button>
      </div>

      <p className="text-sm leading-relaxed text-ink-faint">
        Your answers run through a transparent rules engine — never an AI — to
        reflect a zone back to you on your dashboard.
      </p>
    </PageShell>
  );
}
