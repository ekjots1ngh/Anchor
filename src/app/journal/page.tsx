"use client";

import { useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { useProfile } from "@/lib/useProfile";
import { saveProfile } from "@/lib/store";
import { inputClass } from "@/design/tokens";
import {
  JOURNAL_PROMPTS,
  clinicianName,
  entriesNewestFirst,
  newEntry,
  sharingLabel,
} from "@/lib/journal";
import type { JournalEntry, JournalSharing, Profile } from "@/lib/types";

const SHARE_OPTIONS: { value: JournalSharing; label: string }[] = [
  { value: "private", label: "Just me — private" },
  { value: "summary", label: "My clinician — summary only (no text)" },
  { value: "full", label: "My clinician — full entry" },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function JournalPage() {
  const { profile, loading } = useProfile();

  if (loading)
    return (
      <PageShell title="Journal">
        <p className="text-ink-muted">Loading…</p>
      </PageShell>
    );

  if (!profile?.onboardedAt) {
    return (
      <PageShell
        title="Journal"
        intro="Once your Anchor is set up, this is a private place to write."
      >
        <Card>
          <Link
            href="/onboarding"
            className="inline-flex min-h-[2.75rem] items-center rounded-pill bg-accent px-7 py-3 font-medium text-accent-foreground hover:bg-accent-strong"
          >
            Set up my Anchor
          </Link>
        </Card>
      </PageShell>
    );
  }

  return <Journal profile={profile} />;
}

function Journal({ profile }: { profile: Profile }) {
  const entries = entriesNewestFirst(profile);

  const addEntry = (text: string, prompt?: string) => {
    const entry = { ...newEntry(prompt), text };
    saveProfile({ ...profile, journal: [...(profile.journal ?? []), entry] });
  };

  const updateEntry = (id: string, patch: Partial<JournalEntry>) =>
    saveProfile({
      ...profile,
      journal: (profile.journal ?? []).map((e) =>
        e.id === id ? { ...e, ...patch, updatedAt: new Date().toISOString() } : e,
      ),
    });

  const removeEntry = (id: string) =>
    saveProfile({
      ...profile,
      journal: (profile.journal ?? []).filter((e) => e.id !== id),
    });

  return (
    <PageShell
      title="Journal"
      intro="A private place to write about your thoughts and how you're doing. There are no word counts, no streaks, and nothing to keep up — just space, whenever you want it."
    >
      {/* Privacy, stated plainly */}
      <div className="rounded-2xl border border-line bg-surface px-5 py-4 text-sm leading-relaxed text-ink-muted">
        <span className="font-medium text-ink">Your journal is private to you.</span>{" "}
        Nothing is shared unless you choose to, entry by entry. Anchor never reads,
        scans, or analyses what you write.
      </div>

      {/* Quiet, always-available support — calm, never alarming */}
      <p className="-mt-4 text-sm text-ink-faint">
        Writing can stir things up. If you need a person,{" "}
        <a
          href="#reach-support"
          className="font-medium text-accent-text underline underline-offset-2"
        >
          find support now
        </a>
        .
      </p>

      <Composer onSave={addEntry} />

      {entries.length === 0 ? (
        <Card>
          <p className="text-ink-muted">
            No entries yet. Whenever you feel like it, write a little above — even a
            sentence is plenty.
          </p>
        </Card>
      ) : (
        <div className="space-y-5">
          <h2 className="text-lg font-semibold">Past entries</h2>
          {entries.map((e) => (
            <EntryCard
              key={e.id}
              entry={e}
              clinician={clinicianName(profile)}
              onSaveText={(text) => updateEntry(e.id, { text })}
              onShare={(sharing) => updateEntry(e.id, { sharing })}
              onDelete={() => removeEntry(e.id)}
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}

/* ------------------------------------------------------------------ */
/* Composer                                                            */
/* ------------------------------------------------------------------ */

function Composer({ onSave }: { onSave: (text: string, prompt?: string) => void }) {
  const [text, setText] = useState("");
  const [prompt, setPrompt] = useState<string | undefined>(undefined);

  const save = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSave(trimmed, prompt);
    setText("");
    setPrompt(undefined);
  };

  return (
    <Card>
      <h2 className="font-serif text-xl text-ink">
        {prompt ?? "Write freely"}
      </h2>

      {/* Optional, ignorable prompts */}
      <div className="mt-3 flex flex-wrap gap-2">
        {JOURNAL_PROMPTS.map((p) => {
          const on = prompt === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => setPrompt(on ? undefined : p)}
              aria-pressed={on}
              className={`min-h-[2.25rem] rounded-pill px-3 py-1.5 text-sm font-medium ${
                on
                  ? "bg-accent-soft text-accent-text"
                  : "bg-raised text-ink-muted hover:bg-accent-soft hover:text-accent-text"
              }`}
            >
              {p}
            </button>
          );
        })}
      </div>

      <label className="mt-4 block">
        <span className="sr-only">Your journal entry</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="Write whatever's here. No one sees this unless you choose to share it."
          className={`${inputClass} min-h-[8rem] resize-y leading-relaxed`}
        />
      </label>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Chip tone="neutral">Private to you</Chip>
        <button
          type="button"
          onClick={save}
          disabled={!text.trim()}
          className="inline-flex min-h-[2.75rem] items-center rounded-pill bg-accent px-7 py-3 font-medium text-accent-foreground hover:bg-accent-strong disabled:opacity-60"
        >
          Save entry
        </button>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Entry card                                                          */
/* ------------------------------------------------------------------ */

function EntryCard({
  entry,
  clinician,
  onSaveText,
  onShare,
  onDelete,
}: {
  entry: JournalEntry;
  clinician: string;
  onSaveText: (text: string) => void;
  onShare: (sharing: JournalSharing) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.text);

  const shareTone: "neutral" | "accent" =
    entry.sharing === "private" ? "neutral" : "accent";
  const shareText =
    entry.sharing === "full"
      ? `Shared with ${clinician}`
      : sharingLabel(entry.sharing);

  const saveEdit = () => {
    onSaveText(draft.trim());
    setEditing(false);
  };

  const remove = () => {
    if (
      window.confirm(
        "Delete this entry? This permanently removes it from your device. There's no undo.",
      )
    ) {
      onDelete();
    }
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-ink-faint">{formatDate(entry.createdAt)}</span>
        <Chip tone={shareTone}>{shareText}</Chip>
      </div>

      {entry.prompt ? (
        <p className="mt-3 font-serif text-ink-muted">{entry.prompt}</p>
      ) : null}

      {editing ? (
        <label className="mt-2 block">
          <span className="sr-only">Edit entry</span>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={6}
            className={`${inputClass} min-h-[8rem] resize-y leading-relaxed`}
          />
        </label>
      ) : (
        <p className="mt-2 whitespace-pre-wrap leading-relaxed text-ink">
          {entry.text}
        </p>
      )}

      {/* Per-entry sharing — obvious, granular, revocable */}
      <div className="mt-4 rounded-2xl border border-line bg-canvas px-4 py-3">
        <label className="block">
          <span className="text-sm font-medium text-ink">Who can see this entry?</span>
          <select
            value={entry.sharing}
            onChange={(e) => onShare(e.target.value as JournalSharing)}
            className={`${inputClass} mt-2`}
          >
            {SHARE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <p className="mt-2 text-xs leading-relaxed text-ink-faint">
          {entry.sharing === "private"
            ? "Private. This stays on your device and appears in no summary."
            : entry.sharing === "summary"
              ? "Your clinician summary will note an entry on this date — never its text. Change back to private any time."
              : "Your clinician summary will show this entry's full text, read-only. Change back to private any time."}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {editing ? (
          <>
            <button
              type="button"
              onClick={saveEdit}
              className="inline-flex min-h-[2.75rem] items-center rounded-pill bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent-strong"
            >
              Save changes
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(entry.text);
                setEditing(false);
              }}
              className="inline-flex min-h-[2.75rem] items-center rounded-pill px-5 py-2.5 text-sm font-medium text-ink-muted hover:bg-accent-soft"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft(entry.text);
              setEditing(true);
            }}
            className="inline-flex min-h-[2.75rem] items-center rounded-pill border border-accent/40 px-5 py-2.5 text-sm font-medium text-accent-text hover:bg-accent-soft"
          >
            Edit
          </button>
        )}
        <button
          type="button"
          onClick={remove}
          className="inline-flex min-h-[2.75rem] items-center rounded-pill border border-crisis-border px-5 py-2.5 text-sm font-medium text-crisis-text hover:bg-crisis-soft"
        >
          Delete
        </button>
      </div>
    </Card>
  );
}
