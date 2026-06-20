"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Card } from "@/components/Card";
import { useProfile } from "@/lib/useProfile";
import { saveProfile } from "@/lib/store";
import { steadyState } from "@/lib/checkin";
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

  if (loading)
    return (
      <PageShell title="Your daily check-in">
        <p className="text-ink-muted">Loading…</p>
      </PageShell>
    );

  if (!profile?.onboardedAt) {
    return (
      <PageShell
        title="Your daily check-in"
        intro="First, let's set up your Anchor while you're feeling steady."
      >
        <Card>
          <Link
            href="/onboarding"
            className="inline-flex rounded-pill bg-steady-600 px-7 py-3 font-medium text-white hover:bg-steady-700"
          >
            Set up my Anchor
          </Link>
        </Card>
      </PageShell>
    );
  }

  return <CheckInFlow profile={profile} onDone={() => router.push("/dashboard")} />;
}

function CheckInFlow({
  profile,
  onDone,
}: {
  profile: Profile;
  onDone: () => void;
}) {
  const steady = steadyState(profile);
  const [mode, setMode] = useState<"quick" | "full">(steady.quick ? "quick" : "full");

  if (mode === "quick") {
    return (
      <QuickCheckIn
        profile={profile}
        streak={steady.streak}
        onDone={onDone}
        onFull={() => setMode("full")}
      />
    );
  }
  return (
    <CheckInForm
      profile={profile}
      onDone={onDone}
      canShorten={steady.quick}
      onQuick={() => setMode("quick")}
    />
  );
}

/** Save (or update today's) check-in with the given values. */
function saveCheckIn(
  profile: Profile,
  values: { sleep: SleepQuality; mood: MoodRating; present: Record<string, boolean> },
): Profile {
  const todayKey = dayKey(new Date().toISOString());
  const existing = profile.checkIns.find((c) => dayKey(c.createdAt) === todayKey);
  const record: CheckIn = {
    id: existing?.id ?? crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    sleep: values.sleep,
    mood: values.mood,
    answers: profile.signs.map((s) => ({
      signId: s.id,
      present: !!values.present[s.id],
    })),
  };
  const checkIns = existing
    ? profile.checkIns.map((c) => (c.id === existing.id ? record : c))
    : [...profile.checkIns, record];
  return { ...profile, checkIns };
}

/**
 * The shortened, one-tap check-in offered once someone has been steady for a
 * while. A single big "Still steady" affirms a good day; an escape hatch always
 * lets them do the full check-in instead.
 */
function QuickCheckIn({
  profile,
  streak,
  onDone,
  onFull,
}: {
  profile: Profile;
  streak: number;
  onDone: () => void;
  onFull: () => void;
}) {
  const name = profile.displayName ? `, ${profile.displayName.trim().split(" ")[0]}` : "";
  const confirm = () => {
    // A steady day: good sleep, a settled mood, nothing showing.
    saveProfileAndDone(saveCheckIn(profile, { sleep: "good", mood: 4, present: {} }), onDone);
  };

  return (
    <PageShell title={`Quick check-in${name}`}>
      <Card className="bg-steady-50/50">
        <p className="text-lg leading-relaxed text-ink">
          You&rsquo;ve been steady for {streak} days, so today can be quick.
        </p>
        <p className="mt-2 text-ink-muted">Are you still doing okay?</p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={confirm}
            className="inline-flex min-h-[3.25rem] items-center justify-center rounded-pill bg-steady-600 px-7 py-3 text-lg font-medium text-white hover:bg-steady-700"
          >
            Yes, still steady
          </button>
          <button
            type="button"
            onClick={onFull}
            className="inline-flex min-h-[2.75rem] items-center justify-center rounded-pill px-5 py-3 text-ink-muted hover:bg-steady-50"
          >
            Something feels different — full check-in
          </button>
        </div>
      </Card>
      <p className="text-sm leading-relaxed text-ink-faint">
        Anchor keeps the daily check-in short while you&rsquo;re steady, and asks
        more only when something shifts.
      </p>
    </PageShell>
  );
}

function saveProfileAndDone(next: Profile, onDone: () => void) {
  saveProfile(next);
  onDone();
}

function CheckInForm({
  profile,
  onDone,
  canShorten,
  onQuick,
}: {
  profile: Profile;
  onDone: () => void;
  canShorten?: boolean;
  onQuick?: () => void;
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
    saveProfile(saveCheckIn(profile, { sleep, mood, present }));
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

      {canShorten && onQuick ? (
        <button
          type="button"
          onClick={onQuick}
          className="-mt-2 self-start rounded-pill px-3 py-2 text-sm font-medium text-steady-700 hover:bg-steady-50"
        >
          ← Back to the quick check-in
        </button>
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

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-ink-faint">
          {presentCount === 0
            ? "Nothing showing today."
            : `${presentCount} ${presentCount === 1 ? "sign" : "signs"} marked.`}
        </span>
        <button
          type="button"
          onClick={save}
          className="w-full rounded-pill bg-steady-600 px-7 py-3 font-medium text-white hover:bg-steady-700 sm:w-auto"
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
