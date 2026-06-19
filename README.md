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
  network, no model. Same inputs → same zone, forever. It sums the weights of
  the signs the person reported, compares against a threshold the person and
  their care team agreed, and returns the zone **plus every reason behind it**.
- The dashboard renders those reasons in full (`/dashboard`) — nothing about the
  decision is hidden.
- **`src/lib/messaging.ts`** — `phraseMessage()` is the **only** place an LLM is
  ever permitted, and it may rephrase the human-facing `message` string **and
  nothing else**. It contains a runtime guard that throws if the zone is ever
  changed. Today it's a no-op pass-through (scaffold).

> Rule of thumb: the **decision** is always code you can read. The **wording**
> can be made warmer by a model. The two never mix.

### 3. The person owns their data.

- Data lives in a simple local store (`src/lib/store.ts`) behind a
  storage-agnostic `ProfileStore` interface, so we can swap to Supabase later
  without touching the rest of the app.
- For now it's local JSON under `/data`, which is **gitignored** — a person's
  signs and notes are never committed (`.gitignore`, `data/.gitkeep`).
- The plan screen states the person can export or erase everything at any time.

---

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS 3** for the design system
- **Local JSON / in-memory store** for now (swappable for **Supabase** later)
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

## Routes (scaffolded)

| Route          | Purpose                                                                 |
| -------------- | ----------------------------------------------------------------------- |
| `/`            | Landing page — the three principles, calm entry point.                  |
| `/onboarding`  | Where a person defines their own signs, weights, contacts and plan.     |
| `/checkin`     | A quick "which of my signs are around today?" check-in.                 |
| `/dashboard`   | The zone + **why** (full, inspectable reasons from the rules engine).   |
| `/plan`        | The person's staying-well plan and support contacts, mirrored back.     |

> These are **placeholder scaffolds** — no features are wired up yet beyond a
> live demonstration of the rules engine on `/dashboard`.

## Design system

Calm by design. The goal is that opening Anchor never raises a person's
heart rate.

- **Soft neutral canvas** (`canvas` / warm off-white) with raised `surface` cards.
- **Two — and only two — zone colours:**
  - `steady` → **muted sage-green** ("things look steady")
  - `checkin` → **warm amber** ("might be worth a check-in")
- **No red. No alarm colours.** There is deliberately no "danger" state in the
  palette — Anchor does not shout at people about their own mental health.
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
├── tailwind.config.ts          # design tokens: sage = steady, amber = check-in, no red
├── postcss.config.mjs
├── tsconfig.json
├── .eslintrc.json
├── .gitignore                  # /data/*.json is ignored — the person's data stays theirs
├── data/
│   └── .gitkeep                # local JSON store lives here (gitignored content)
└── src/
    ├── app/
    │   ├── layout.tsx          # root layout + fonts
    │   ├── globals.css         # Tailwind layers + base styles
    │   ├── page.tsx            # landing page
    │   ├── onboarding/page.tsx # scaffold
    │   ├── checkin/page.tsx    # scaffold
    │   ├── dashboard/page.tsx  # scaffold — renders a live rules-engine result
    │   └── plan/page.tsx       # scaffold
    ├── components/
    │   ├── PageShell.tsx       # page frame, nav, persistent care-not-replace footer
    │   ├── Card.tsx            # soft rounded surface
    │   ├── Button.tsx          # calm pill action
    │   └── ZoneBadge.tsx       # sage / amber badge (no red variant exists)
    ├── design/
    │   └── tokens.ts           # zones + spacing/radius tokens in code
    └── lib/
        ├── types.ts            # domain types — note: no "diagnosis"/"severity"
        ├── rules-engine.ts     # THE zone decision. Deterministic. No LLM. Ever.
        ├── messaging.ts        # the ONLY place an LLM may touch — wording only
        └── store.ts            # ProfileStore interface + local store (Supabase later)
```

## Roadmap (post-scaffold)

- Wire onboarding → store → check-in → dashboard end to end.
- Persist to local JSON, then add a Supabase `ProfileStore` implementation.
- Add the optional LLM rephrasing behind `phraseMessage()` (wording only).
- Data export & erase controls on `/plan`.

## License

Prototype — not for clinical use.
