# Anchor

**A calm staying-well companion for people managing psychosis or schizophrenia relapse.**

Anchor mirrors a person's *own* pre-agreed early-warning signs back to them and
helps them reach real human support. It is a hackathon prototype.

> Anchor is **not** a diagnostic tool and makes **no** medical claims. It
> supports clinical care — it never replaces it. If you are in crisis, contact
> your care team or local emergency services.

---

## The three principles (baked into the architecture)

These aren't aspirations in a doc — they're enforced by where code is allowed
to live.

### 1. Not diagnostic. A mirror, not a verdict.

Anchor never tells anyone they are unwell, scores how unwell they are, or makes
any clinical judgement. It reflects back the early-warning signs **the person
themselves chose** during onboarding, in their own words, and helps them reach
the people on their plan.

- The language throughout is gentle and non-alarming (see _Design_ below).
- A standing reminder that Anchor supports — and never replaces — clinical care
  sits in the footer of every screen (`src/components/PageShell.tsx`).
- The domain types (`src/lib/types.ts`) deliberately model *the person's signs
  and plan* — there is no "diagnosis" or "severity" concept anywhere.

### 2. Zone decisions come from a transparent rules engine — NEVER from an LLM.

Which zone a check-in falls into (`steady` vs `worth a check-in`) is decided by
one small, deterministic, fully inspectable function:

- **`src/lib/rules-engine.ts`** — `evaluateZone()`. Pure function, no I/O, no
  network, no model. Same inputs → same zone, forever. The whole rule is small
  enough to read aloud: count how many of the person's own early-warning signs
  are present, then compare against the two thresholds the person set while
  well (`baseline.amberAt`, `baseline.redAt`). It returns the zone **plus every
  reason behind it**.
- The dashboard renders those reasons in full (`/dashboard`) — nothing about the
  decision is hidden.
- **`src/lib/messaging.ts`** — `phraseMessage()` is the **only** place an LLM is
  ever permitted, and it may rephrase the human-facing `message` string **and
  nothing else**. It contains a runtime guard that throws if the zone is ever
  changed. Today it's a no-op pass-through (scaffold).

> Rule of thumb: the **decision** is always code you can read. The **wording**
> can be made warmer by a model. The two never mix.

### 3. The person owns their data.

- Data lives in a simple local store (`src/lib/store.ts`) behind a small,
  storage-agnostic API (`loadProfile` / `saveProfile` / `clearProfile`), so we
  can swap to Supabase (or an encrypted local file) later without touching the
  rest of the app.
- For now it's the browser's `localStorage` — on the person's own device,
  never sent anywhere. The `/data` folder remains reserved for a future local
  JSON/file store and its `*.json` contents are **gitignored**
  (`.gitignore`, `data/.gitkeep`).
- The **plan screen** (`/plan`) lets the person **export** their whole profile
  as JSON or **erase** it entirely, any time, no questions asked.

---

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS 3** for the design system
- **`localStorage`** local store for now (swappable for **Supabase** later)
- Deploy target: **Vercel**

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts:

```bash
npm run build      # production build
npm run lint       # next lint
npm run typecheck  # tsc --noEmit
```

## Routes

| Route          | Purpose                                                                 | State |
| -------------- | ----------------------------------------------------------------------- | ----- |
| `/`            | Landing page — the three principles, calm entry point.                  | built |
| `/onboarding`  | A few gentle steps, done **when well**: pick early-warning signs from a starter library and add custom ones, set a baseline + name the three zones in your own words, write staying-well actions, add a trusted circle, and a crisis line. Saves to the local store. | **built** |
| `/checkin`     | A quick "which of my signs are around today?" check-in; runs the rules engine. | built (light) |
| `/dashboard`   | The zone (in your words) + **why** — full, inspectable reasons from the rules engine. | built |
| `/plan`        | The whole plan mirrored back, plus **export / erase my data** controls. | built |

### Onboarding flow

`/onboarding` is a single client component (`src/app/onboarding/page.tsx`) that
holds a **draft** `Profile` in memory and only writes to the store when the
person taps *Save my plan*. The tone throughout assumes the person is doing
this on a good day — it opens with *"Best done on a good day"* and frames the
whole exercise as writing a note to your future self.

Steps: **Welcome → Your signs → Your baseline → What helps → Your circle →
Crisis line → Review**.

## Design system

Calm by design. The goal is that opening Anchor never raises a person's
heart rate.

- **Soft neutral canvas** (`canvas` / warm off-white) with raised `surface` cards.
- **Three zones — and not one alarm colour among them:**
  - `green` → **muted sage-green** (`steady` palette) — the person is anchored.
  - `amber` → **warm amber** (`checkin` palette) — worth a check-in.
  - `red` → **muted clay / terracotta** (`crisis` palette) — *"real support, now."*
- **No alarm-red.** The `red` zone exists in the model (it's the crisis tier and
  maps to the crisis plan), but it is rendered as a dignified, muted clay —
  **never** an emergency red. Anchor does not shout at people about their own
  mental health. The zones are also shown using **the person's own words**, not
  labels like "relapse" or "crisis".
- **Generous spacing**, **rounded cards** (`rounded-card`), soft low-contrast
  shadows.

Tokens live in **`tailwind.config.ts`** (Tailwind theme) and
**`src/design/tokens.ts`** (the same tokens in code, for non-CSS use).

## Project structure

```
anchor/
├── README.md
├── package.json
├── next.config.mjs
├── tailwind.config.ts          # design tokens: sage=green, amber=amber, clay=red (no alarm-red)
├── postcss.config.mjs
├── tsconfig.json
├── .eslintrc.json
├── .gitignore                  # /data/*.json is ignored — the person's data stays theirs
├── data/
│   └── .gitkeep                # reserved for a future local JSON/file store (gitignored content)
└── src/
    ├── app/
    │   ├── layout.tsx          # root layout + fonts
    │   ├── globals.css         # Tailwind layers + base styles
    │   ├── page.tsx            # landing page
    │   ├── onboarding/page.tsx # the gentle multi-step "set up when well" flow
    │   ├── checkin/page.tsx    # mark which signs are present → runs the rules engine
    │   ├── dashboard/page.tsx  # zone (in the person's words) + full inspectable reasons
    │   └── plan/page.tsx       # whole plan mirrored back + export / erase my data
    ├── components/
    │   ├── PageShell.tsx       # page frame, nav, persistent care-not-replace footer
    │   ├── Card.tsx            # soft rounded surface
    │   ├── Button.tsx          # calm pill action
    │   └── ZoneBadge.tsx       # green / amber / clay badge (no alarm-red variant exists)
    ├── design/
    │   └── tokens.ts           # per-zone style tokens + spacing/radius, in code
    └── lib/
        ├── types.ts            # core domain types — no "diagnosis"/"severity" anywhere
        ├── starter-library.ts  # small starter sign library + default zone words + crisis line
        ├── rules-engine.ts     # THE zone decision. Deterministic. No LLM. Ever.
        ├── messaging.ts        # the ONLY place an LLM may touch — wording only
        ├── store.ts            # local (localStorage) store; swappable for Supabase later
        └── useProfile.ts       # client hook to read the saved profile after hydration
```

## Core domain types (`src/lib/types.ts`)

- **`EarlyWarningSign`** — `name`, `category` (sleep / social / thought / mood /
  perception / self-care), and the person's own `description`.
- **`Zone`** — one of `green` / `amber` / `red`, each carrying the person's own
  `label` and `description` (their words, not ours).
- **`Baseline`** — "what well looks like for me", plus the transparent
  `amberAt` / `redAt` thresholds the rules engine uses.
- **`StayingWellAction`** — something that helps, optionally tied to a zone.
- **`TrustedContact`** — `name`, `relationship`, optional `phone`, an
  `alertAtZone`, and a `consent` flag (never added silently).
- **`CrisisPlan`** — a real crisis line plus the person's own wishes for a crisis.

## Roadmap (next)

- Trends over time on the dashboard (history of check-ins).
- A Supabase store implementation behind the same `load/save/clear` API.
- The optional LLM rephrasing behind `phraseMessage()` (wording only).
- Optional reminders / notifications to the trusted circle (with consent).

## License

Prototype — not for clinical use.
