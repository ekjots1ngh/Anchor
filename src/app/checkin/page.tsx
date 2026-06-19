"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { Card } from "@/components/Card";
import { useProfile } from "@/lib/useProfile";
import { saveProfile } from "@/lib/store";
import type { CheckIn } from "@/lib/types";

export default function CheckInPage() {
  const router = useRouter();
  const { profile, loading } = useProfile();
  const [present, setPresent] = useState<Record<string, boolean>>({});

  if (loading) return <PageShell title="A quick check-in">{null}</PageShell>;

  if (!profile?.onboardedAt) {
    return (
      <PageShell
        title="A quick check-in"
        intro="First, let's set up your Anchor while you're feeling steady."
      >
        <Card>
          <a
            href="/onboarding"
            className="rounded-pill bg-steady-400 px-7 py-3 font-medium text-white hover:bg-steady-500"
          >
            Set up my Anchor
          </a>
        </Card>
      </PageShell>
    );
  }

  const toggle = (id: string) =>
    setPresent((p) => ({ ...p, [id]: !p[id] }));

  const save = () => {
    const checkIn: CheckIn = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      answers: profile.signs.map((s) => ({
        signId: s.id,
        present: !!present[s.id],
      })),
    };
    saveProfile({ ...profile, checkIns: [...profile.checkIns, checkIn] });
    router.push("/dashboard");
  };

  return (
    <PageShell
      title={`A quick check-in${profile.displayName ? `, ${profile.displayName}` : ""}`}
      intro="Just notice which of your own signs are around today. There are no right answers and nothing is scored against you — Anchor only reflects your picture back."
    >
      <Card>
        <h2 className="text-xl font-semibold">Are any of these around for you today?</h2>
        <ul className="mt-6 space-y-2">
          {profile.signs.map((s) => {
            const on = !!present[s.id];
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => toggle(s.id)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-5 py-4 text-left transition-colors ${
                    on ? "border-checkin-300 bg-checkin-50" : "border-line bg-surface hover:bg-steady-50/40"
                  }`}
                >
                  <span>
                    <span className="block font-medium text-ink">{s.name}</span>
                    <span className="block text-sm text-ink-faint">{s.description}</span>
                  </span>
                  <span className="text-sm text-ink-faint">{on ? "Yes, today" : "Not today"}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-8">
          <button
            type="button"
            onClick={save}
            className="rounded-pill bg-steady-400 px-7 py-3 font-medium text-white hover:bg-steady-500"
          >
            See where I'm at
          </button>
        </div>
        <p className="mt-6 text-sm leading-relaxed text-ink-faint">
          Your answers run through a transparent rules engine — never an AI — to
          reflect a zone back to you.
        </p>
      </Card>
    </PageShell>
  );
}
