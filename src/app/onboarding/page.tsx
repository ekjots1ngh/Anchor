"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";
import { ZoneBadge } from "@/components/ZoneBadge";
import { createEmptyProfile, saveProfile } from "@/lib/store";
import {
  STARTER_SIGNS,
  STAYING_WELL_EXAMPLES,
  starterToSign,
  type StarterSign,
} from "@/lib/starter-library";
import { PrototypeNotice } from "@/components/PrototypeNotice";
import {
  CONTACT_VISIBILITY_LABELS,
  SIGN_CATEGORY_BLURBS,
  SIGN_CATEGORY_LABELS,
  type ContactVisibility,
  type EarlyWarningSign,
  type Profile,
  type SignCategory,
  type StayingWellAction,
  type TrustedContact,
  type ZoneId,
} from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Small, calm form primitives                                         */
/* ------------------------------------------------------------------ */

const inputBase =
  "w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink placeholder:text-ink-faint focus:outline-none focus-visible:ring-2 focus-visible:ring-steady-300";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      {hint ? <span className="mt-1 block text-sm text-ink-faint">{hint}</span> : null}
      <div className="mt-2">{children}</div>
    </label>
  );
}

function Stepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="inline-flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="h-9 w-9 rounded-pill border border-line text-ink-muted hover:bg-steady-50"
        aria-label="Fewer"
      >
        -
      </button>
      <span className="w-6 text-center text-lg font-medium tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="h-9 w-9 rounded-pill border border-line text-ink-muted hover:bg-steady-50"
        aria-label="More"
      >
        +
      </button>
    </div>
  );
}

const ZONE_ORDER: ZoneId[] = ["green", "amber", "red"];

/* ------------------------------------------------------------------ */
/* Steps                                                               */
/* ------------------------------------------------------------------ */

const STEPS = [
  "Welcome",
  "Your signs",
  "Your baseline",
  "What helps",
  "Your circle",
  "Crisis line",
  "Review",
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  // Draft profile lives entirely in memory until the person chooses to save.
  const [draft, setDraft] = useState<Profile>(() => createEmptyProfile());

  const update = (patch: Partial<Profile>) => setDraft((d) => ({ ...d, ...patch }));

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const finish = () => {
    const completed: Profile = { ...draft, onboardedAt: new Date().toISOString() };
    saveProfile(completed);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <main className="mx-auto max-w-content px-6 py-12 sm:py-16">
        <ProgressDots step={step} />

        <div className="mt-10 space-y-8">
          {step === 0 && <Welcome draft={draft} update={update} />}
          {step === 1 && <SignsStep draft={draft} update={update} />}
          {step === 2 && <BaselineStep draft={draft} update={update} />}
          {step === 3 && <ActionsStep draft={draft} update={update} />}
          {step === 4 && <CircleStep draft={draft} update={update} />}
          {step === 5 && <CrisisStep draft={draft} update={update} />}
          {step === 6 && <ReviewStep draft={draft} />}
        </div>

        <div className="mt-10 flex items-center justify-between">
          <button
            type="button"
            onClick={back}
            disabled={step === 0}
            className="rounded-pill px-5 py-3 text-ink-muted hover:bg-steady-50 disabled:invisible"
          >
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={next}
              className="rounded-pill bg-steady-600 px-7 py-3 font-medium text-white hover:bg-steady-700"
            >
              {step === 0 ? "Begin" : "Continue"}
            </button>
          ) : (
            <button
              type="button"
              onClick={finish}
              className="rounded-pill bg-steady-600 px-7 py-3 font-medium text-white hover:bg-steady-700"
            >
              Save my plan
            </button>
          )}
        </div>

        <p className="mt-12 text-sm leading-relaxed text-ink-faint">
          Take your time, you can stop and come back. Anchor is not a
          diagnostic tool and makes no medical claims. It supports your care, it
          never replaces it. Everything you write stays on your device.
        </p>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Progress                                                            */
/* ------------------------------------------------------------------ */

function ProgressDots({ step }: { step: number }) {
  return (
    <div>
      <p className="text-sm font-medium text-ink-faint">
        Step {step + 1} of {STEPS.length} · {STEPS[step]}
      </p>
      <div className="mt-3 flex gap-2">
        {STEPS.map((label, i) => (
          <span
            key={label}
            className={`h-1.5 flex-1 rounded-pill ${
              i <= step ? "bg-steady-600" : "bg-line"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 0 — Welcome (sets the "done when well" tone)                   */
/* ------------------------------------------------------------------ */

function Welcome({
  draft,
  update,
}: {
  draft: Profile;
  update: (p: Partial<Profile>) => void;
}) {
  return (
    <>
      <div>
        <span className="rounded-pill bg-steady-100 px-4 py-1.5 text-sm font-medium text-steady-700">
          Best done on a good day
        </span>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
          Let&rsquo;s set up your Anchor while you&rsquo;re feeling steady.
        </h1>
        <p className="mt-5 max-w-prose text-lg leading-relaxed text-ink-muted">
          This works best done now: calm, unhurried, ideally alongside someone
          on your care team. You&rsquo;re writing a note to your future self: the
          signs you want to watch for, what helps, and who to reach. Nothing
          here is decided for you, and you can change any of it later.
        </p>
      </div>

      <Card>
        <Field
          label="What should Anchor call you?"
          hint="Optional, just so the app feels like yours."
        >
          <input
            className={inputBase}
            value={draft.displayName}
            onChange={(e) => update({ displayName: e.target.value })}
            placeholder="Your name or a nickname"
          />
        </Field>
      </Card>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Step 1 — Early-warning signs                                        */
/* ------------------------------------------------------------------ */

function SignsStep({
  draft,
  update,
}: {
  draft: Profile;
  update: (p: Partial<Profile>) => void;
}) {
  const selectedIds = new Set(draft.signs.map((s) => s.id));
  // One domain open at a time, to keep the number of choices on screen small.
  const [openCategory, setOpenCategory] = useState<SignCategory | null>("sleep");

  const grouped = useMemo(() => {
    const map = new Map<SignCategory, StarterSign[]>();
    for (const s of STARTER_SIGNS) {
      const list = map.get(s.category) ?? [];
      list.push(s);
      map.set(s.category, list);
    }
    return [...map.entries()];
  }, []);

  const toggle = (s: StarterSign) => {
    if (selectedIds.has(s.id)) {
      update({ signs: draft.signs.filter((x) => x.id !== s.id) });
    } else {
      update({ signs: [...draft.signs, starterToSign(s)] });
    }
  };

  const editDescription = (id: string, description: string) =>
    update({
      signs: draft.signs.map((s) => (s.id === id ? { ...s, description } : s)),
    });

  const removeSign = (id: string) =>
    update({ signs: draft.signs.filter((s) => s.id !== id) });

  const addCustom = (sign: EarlyWarningSign) =>
    update({ signs: [...draft.signs, sign] });

  return (
    <>
      <StepHeader
        title="What do you want to watch for?"
        intro="Take it one area at a time. Open an area, tap anything that rings true, and make the words your own. There are no right answers."
      />

      <PrototypeNotice />

      {grouped.map(([category, signs]) => {
        const isOpen = openCategory === category;
        const count = signs.filter((s) => selectedIds.has(s.id)).length;
        return (
          <Card key={category} className="p-0">
            <button
              type="button"
              onClick={() => setOpenCategory(isOpen ? null : category)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-3 rounded-card px-6 py-5 text-left hover:bg-steady-50/40 sm:px-8"
            >
              <span>
                <span className="block text-lg font-semibold text-ink">
                  {SIGN_CATEGORY_LABELS[category]}
                </span>
                <span className="mt-1 block text-sm text-ink-faint">
                  {SIGN_CATEGORY_BLURBS[category]}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-3">
                {count > 0 ? (
                  <span className="rounded-pill bg-steady-100 px-3 py-1 text-sm font-medium text-steady-700">
                    {count}
                  </span>
                ) : null}
                <span aria-hidden className={`text-ink-faint transition-transform ${isOpen ? "rotate-90" : ""}`}>
                  ›
                </span>
              </span>
            </button>
            {isOpen && (
              <div className="space-y-2 px-6 pb-6 sm:px-8">
                {signs.map((s) => {
                  const picked = selectedIds.has(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggle(s)}
                      aria-pressed={picked}
                      className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-4 text-left transition-colors ${
                        picked
                          ? "border-steady-300 bg-steady-50"
                          : "border-line bg-surface hover:bg-steady-50/40"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                          picked
                            ? "border-steady-600 bg-steady-600 text-white"
                            : "border-line"
                        }`}
                        aria-hidden
                      >
                        {picked ? "✓" : ""}
                      </span>
                      <span>
                        <span className="block font-medium text-ink">{s.name}</span>
                        <span className="mt-0.5 block text-sm text-ink-muted">
                          {s.example}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}

      {draft.signs.length > 0 && (
        <Card className="bg-steady-50/40">
          <h2 className="text-base font-semibold">
            Your signs, in your words
          </h2>
          <p className="mt-1 text-sm text-ink-faint">
            Tweak the wording so each one sounds like you.
          </p>
          <div className="mt-4 space-y-4">
            {draft.signs.map((s) => (
              <div key={s.id} className="rounded-2xl border border-line bg-surface p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{s.name}</span>
                  <button
                    type="button"
                    onClick={() => removeSign(s.id)}
                    className="text-sm text-ink-faint hover:text-ink-muted"
                  >
                    Remove
                  </button>
                </div>
                <textarea
                  className={`${inputBase} mt-3 min-h-[3.5rem]`}
                  value={s.description}
                  onChange={(e) => editDescription(s.id, e.target.value)}
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      <AddCustomSign onAdd={addCustom} />
    </>
  );
}

function AddCustomSign({ onAdd }: { onAdd: (s: EarlyWarningSign) => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<SignCategory>("thinking");
  const [description, setDescription] = useState("");

  const canAdd = name.trim().length > 0;

  const submit = () => {
    if (!canAdd) return;
    onAdd({
      id: crypto.randomUUID(),
      name: name.trim(),
      category,
      description: description.trim(),
      source: "custom",
    });
    setName("");
    setDescription("");
  };

  return (
    <Card>
      <h2 className="text-base font-semibold">Add your own</h2>
      <p className="mt-1 text-sm text-ink-faint">
        Something only you would notice? Add it here.
      </p>
      <div className="mt-4 space-y-4">
        <Field label="Name">
          <input
            className={inputBase}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Checking the locks over and over"
          />
        </Field>
        <Field label="Which area?">
          <select
            className={inputBase}
            value={category}
            onChange={(e) => setCategory(e.target.value as SignCategory)}
          >
            {(Object.keys(SIGN_CATEGORY_LABELS) as SignCategory[]).map((c) => (
              <option key={c} value={c}>
                {SIGN_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="In your words" hint="Optional, how does it show up for you?">
          <textarea
            className={`${inputBase} min-h-[3.5rem]`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <button
          type="button"
          onClick={submit}
          disabled={!canAdd}
          className="rounded-pill border border-steady-300 px-5 py-2.5 font-medium text-steady-700 hover:bg-steady-50 disabled:opacity-40"
        >
          Add sign
        </button>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Step 2 — Baseline + zone words                                      */
/* ------------------------------------------------------------------ */

function BaselineStep({
  draft,
  update,
}: {
  draft: Profile;
  update: (p: Partial<Profile>) => void;
}) {
  const setZone = (id: ZoneId, patch: Partial<{ label: string; description: string }>) =>
    update({
      zones: { ...draft.zones, [id]: { ...draft.zones[id], ...patch } },
    });

  const setBaseline = (patch: Partial<Profile["baseline"]>) =>
    update({ baseline: { ...draft.baseline, ...patch } });

  const signCount = draft.signs.length;

  return (
    <>
      <StepHeader
        title="What does steady look like for you?"
        intro="This is your baseline, the version of you Anchor will gently compare against. Then put the three zones into your own words."
      />

      <Card>
        <Field
          label="My steady, well self"
          hint="A sentence or two. What's true when you're doing okay?"
        >
          <textarea
            className={`${inputBase} min-h-[5rem]`}
            value={draft.baseline.description}
            onChange={(e) => setBaseline({ description: e.target.value })}
            placeholder="When I'm well I sleep through, I reply to friends, and food tastes good."
          />
        </Field>
      </Card>

      <Card>
        <h2 className="text-base font-semibold">Your three zones, your words</h2>
        <p className="mt-1 text-sm text-ink-faint">
          Anchor never calls these &ldquo;relapse&rdquo; or &ldquo;crisis.&rdquo;
          You choose what they&rsquo;re called.
        </p>
        <div className="mt-5 space-y-5">
          {ZONE_ORDER.map((id) => (
            <div key={id} className="rounded-2xl border border-line p-4">
              <ZoneBadge zone={id} label={draft.zones[id].label || undefined} />
              <div className="mt-3 space-y-3">
                <input
                  className={inputBase}
                  value={draft.zones[id].label}
                  onChange={(e) => setZone(id, { label: e.target.value })}
                  placeholder="A name for this zone"
                />
                <textarea
                  className={`${inputBase} min-h-[3.5rem]`}
                  value={draft.zones[id].description}
                  onChange={(e) => setZone(id, { description: e.target.value })}
                  placeholder="What this feels like for you"
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-semibold">When should Anchor nudge you?</h2>
        <p className="mt-1 text-sm text-ink-faint">
          The only rule Anchor uses: how many of your{" "}
          {signCount > 0 ? signCount : ""} signs showing at once moves you
          between zones. Transparent, and yours to set.
        </p>
        <div className="mt-5 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-ink">
              Signs showing before <strong>amber</strong>
            </span>
            <Stepper
              value={draft.baseline.amberAt}
              min={1}
              max={Math.max(1, signCount || 6)}
              onChange={(n) =>
                setBaseline({
                  amberAt: n,
                  redAt: Math.max(n + 1, draft.baseline.redAt),
                })
              }
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-ink">
              Signs showing before <strong>red</strong>
            </span>
            <Stepper
              value={draft.baseline.redAt}
              min={draft.baseline.amberAt + 1}
              max={Math.max(draft.baseline.amberAt + 1, signCount || 8)}
              onChange={(n) => setBaseline({ redAt: n })}
            />
          </div>
        </div>
      </Card>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Step 3 — Staying-well actions                                       */
/* ------------------------------------------------------------------ */

function ActionsStep({
  draft,
  update,
}: {
  draft: Profile;
  update: (p: Partial<Profile>) => void;
}) {
  const [text, setText] = useState("");

  const add = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const action: StayingWellAction = { id: crypto.randomUUID(), text: trimmed };
    update({ stayingWellActions: [...draft.stayingWellActions, action] });
  };

  const remove = (id: string) =>
    update({
      stayingWellActions: draft.stayingWellActions.filter((a) => a.id !== id),
    });

  const alreadyAdded = new Set(
    draft.stayingWellActions.map((a) => a.text.toLowerCase()),
  );

  return (
    <>
      <StepHeader
        title="What helps you stay well?"
        intro="The small, reliable things that keep you steady. When amber shows up, Anchor will gently put these back in front of you."
      />

      <Card>
        <div className="flex flex-wrap gap-2">
          {STAYING_WELL_EXAMPLES.filter(
            (e) => !alreadyAdded.has(e.toLowerCase()),
          ).map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => add(e)}
              className="rounded-pill border border-line px-4 py-2 text-sm text-ink-muted hover:bg-steady-50"
            >
              + {e}
            </button>
          ))}
        </div>

        <div className="mt-5 flex gap-2">
          <input
            className={inputBase}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                add(text);
                setText("");
              }
            }}
            placeholder="Add something that helps you…"
          />
          <button
            type="button"
            onClick={() => {
              add(text);
              setText("");
            }}
            className="shrink-0 rounded-pill bg-steady-600 px-5 py-3 font-medium text-white hover:bg-steady-700"
          >
            Add
          </button>
        </div>

        {draft.stayingWellActions.length > 0 && (
          <ul className="mt-5 space-y-2">
            {draft.stayingWellActions.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between rounded-2xl border border-line px-4 py-3"
              >
                <span>{a.text}</span>
                <button
                  type="button"
                  onClick={() => remove(a.id)}
                  className="text-sm text-ink-faint hover:text-ink-muted"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Step 4 — Trusted circle                                             */
/* ------------------------------------------------------------------ */

function CircleStep({
  draft,
  update,
}: {
  draft: Profile;
  update: (p: Partial<Profile>) => void;
}) {
  const add = (contact: TrustedContact) =>
    update({ trustedContacts: [...draft.trustedContacts, contact] });

  const remove = (id: string) =>
    update({
      trustedContacts: draft.trustedContacts.filter((c) => c.id !== id),
    });

  return (
    <>
      <StepHeader
        title="Who's in your trusted circle?"
        intro="The real people you'd want reached, and at which zone. Only add someone who's agreed to it; reaching a human is always the point."
      />

      {draft.trustedContacts.length > 0 && (
        <Card>
          <h2 className="text-base font-semibold">Your circle</h2>
          <ul className="mt-4 space-y-3">
            {draft.trustedContacts.map((c) => (
              <li
                key={c.id}
                className="flex items-start justify-between rounded-2xl border border-line px-4 py-3"
              >
                <div>
                  <span className="font-medium">{c.name}</span>
                  <span className="block text-sm text-ink-faint">
                    {c.relationship}
                    {c.phone ? ` · ${c.phone}` : ""}
                  </span>
                  <span className="mt-2 inline-flex items-center gap-2 text-sm text-ink-faint">
                    Reach from <ZoneBadge zone={c.alertAtZone} label={draft.zones[c.alertAtZone].label || undefined} />
                    {c.consent ? "" : " · consent not yet confirmed"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  className="text-sm text-ink-faint hover:text-ink-muted"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <AddContact onAdd={add} />
    </>
  );
}

function AddContact({ onAdd }: { onAdd: (c: TrustedContact) => void }) {
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [phone, setPhone] = useState("");
  const [alertAtZone, setAlertAtZone] = useState<ZoneId>("amber");
  const [visibility, setVisibility] = useState<ContactVisibility>("nudge");
  const [consent, setConsent] = useState(false);

  const canAdd = name.trim().length > 0 && consent;

  const submit = () => {
    if (!canAdd) return;
    onAdd({
      id: crypto.randomUUID(),
      name: name.trim(),
      relationship: relationship.trim(),
      phone: phone.trim() || undefined,
      alertAtZone,
      visibility,
      consent,
    });
    setName("");
    setRelationship("");
    setPhone("");
    setAlertAtZone("amber");
    setVisibility("nudge");
    setConsent(false);
  };

  return (
    <Card>
      <h2 className="text-base font-semibold">Add someone</h2>
      <div className="mt-4 space-y-4">
        <Field label="Name">
          <input
            className={inputBase}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sam"
          />
        </Field>
        <Field label="How you know them">
          <input
            className={inputBase}
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            placeholder="e.g. Close friend, Care coordinator"
          />
        </Field>
        <Field label="Phone" hint="Optional">
          <input
            className={inputBase}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="So you can reach them in one tap"
          />
        </Field>
        <Field label="Reach them from which zone?">
          <select
            className={inputBase}
            value={alertAtZone}
            onChange={(e) => setAlertAtZone(e.target.value as ZoneId)}
          >
            <option value="green">Green, keep them in the loop anytime</option>
            <option value="amber">Amber, when a few signs show</option>
            <option value="red">Red, only when I really need support</option>
          </select>
        </Field>
        <Field
          label="What can they see?"
          hint="You can change this any time in Your data."
        >
          <select
            className={inputBase}
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as ContactVisibility)}
          >
            {(Object.keys(CONTACT_VISIBILITY_LABELS) as ContactVisibility[]).map((v) => (
              <option key={v} value={v}>
                {CONTACT_VISIBILITY_LABELS[v]}
              </option>
            ))}
          </select>
        </Field>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-5 w-5 rounded border-line text-steady-400 focus:ring-steady-300"
          />
          <span className="text-sm text-ink-muted">
            This person has agreed to be part of my trusted circle.
          </span>
        </label>
        <button
          type="button"
          onClick={submit}
          disabled={!canAdd}
          className="rounded-pill border border-steady-300 px-5 py-2.5 font-medium text-steady-700 hover:bg-steady-50 disabled:opacity-40"
        >
          Add to circle
        </button>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Step 5 — Crisis line                                                */
/* ------------------------------------------------------------------ */

function CrisisStep({
  draft,
  update,
}: {
  draft: Profile;
  update: (p: Partial<Profile>) => void;
}) {
  const set = (patch: Partial<Profile["crisisPlan"]>) =>
    update({ crisisPlan: { ...draft.crisisPlan, ...patch } });

  return (
    <>
      <StepHeader
        title="Your crisis line"
        intro="One real service you'd call if things reach red. We've prefilled a suggestion; change it to whoever you trust."
      />

      <Card>
        <div className="space-y-4">
          <Field label="Crisis line name">
            <input
              className={inputBase}
              value={draft.crisisPlan.crisisLineName}
              onChange={(e) => set({ crisisLineName: e.target.value })}
            />
          </Field>
          <Field label="Phone number">
            <input
              className={inputBase}
              value={draft.crisisPlan.crisisLinePhone}
              onChange={(e) => set({ crisisLinePhone: e.target.value })}
            />
          </Field>
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-semibold">
          What you&rsquo;d want others to know
        </h2>
        <p className="mt-1 text-sm text-ink-faint">
          Optional: a note to the people helping you, written by you now.
        </p>
        <div className="mt-4 space-y-4">
          <Field label="What helps me in a crisis">
            <textarea
              className={`${inputBase} min-h-[3.5rem]`}
              value={draft.crisisPlan.whatHelps ?? ""}
              onChange={(e) => set({ whatHelps: e.target.value })}
              placeholder="e.g. Stay calm, talk slowly, don't crowd me."
            />
          </Field>
          <Field label="What to avoid">
            <textarea
              className={`${inputBase} min-h-[3.5rem]`}
              value={draft.crisisPlan.whatToAvoid ?? ""}
              onChange={(e) => set({ whatToAvoid: e.target.value })}
              placeholder="e.g. Don't call the whole family at once."
            />
          </Field>
          <Field label="Anything else">
            <textarea
              className={`${inputBase} min-h-[3.5rem]`}
              value={draft.crisisPlan.notes ?? ""}
              onChange={(e) => set({ notes: e.target.value })}
              placeholder="A safe place to go, who to call first…"
            />
          </Field>
        </div>
      </Card>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Step 6 — Review                                                     */
/* ------------------------------------------------------------------ */

function ReviewStep({ draft }: { draft: Profile }) {
  return (
    <>
      <StepHeader
        title="Here's your plan"
        intro="Take a look. When this feels right, save it. It stays on your device, and you can change anything whenever you like."
      />

      <Card>
        <SummaryRow label="Signs you're watching" value={`${draft.signs.length} chosen`} />
        <SummaryRow
          label="Nudges"
          value={`Amber at ${draft.baseline.amberAt}, red at ${draft.baseline.redAt} signs`}
        />
        <SummaryRow
          label="Things that help"
          value={`${draft.stayingWellActions.length} listed`}
        />
        <SummaryRow
          label="Trusted circle"
          value={`${draft.trustedContacts.length} ${
            draft.trustedContacts.length === 1 ? "person" : "people"
          }`}
        />
        <SummaryRow
          label="Crisis line"
          value={`${draft.crisisPlan.crisisLineName} · ${draft.crisisPlan.crisisLinePhone}`}
        />
      </Card>

      <Card className="bg-steady-50/50">
        <p className="text-sm leading-relaxed text-ink-muted">
          A gentle reminder: Anchor only ever mirrors this back to you. It makes
          no medical claims and decides nothing about your care. If you&rsquo;re
          ever in danger, call your crisis line or local emergency services.
        </p>
      </Card>
    </>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-3 last:border-0">
      <span className="text-ink-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared step header                                                  */
/* ------------------------------------------------------------------ */

function StepHeader({ title, intro }: { title: string; intro: string }) {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-4 max-w-prose text-lg leading-relaxed text-ink-muted">
        {intro}
      </p>
    </div>
  );
}
