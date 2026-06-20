# Anchor

**A calm staying-well companion for people managing psychosis or schizophrenia relapse.**

Anchor mirrors a person's *own* pre-agreed early-warning signs back to them and
helps them reach real human support. It is a hackathon prototype.

> Anchor is an **unvalidated prototype, not a medical device** or a diagnostic
> tool, and makes **no** medical claims. It supports clinical care — it never
> replaces it. If you are in crisis, contact your care team or local emergency
> services.

---

## Signs library & accessibility

- **Framework-grounded signs.** The starter early-warning signs
  (`src/lib/starter-library.ts`) are organised by the five staying-well
  **domains** — Sleep & energy, People & connection, Thinking & perception,
  Everyday function, Mood & feelings — with wording drawn from established
  relapse-prevention and early-warning-signs / staying-well-plan frameworks
  (e.g. WRAP and relapse early-signs work). They're generic starting points the
  person rewrites in their own words. A visible **"prototype — not a medical
  device"** note (`PrototypeNotice`) appears wherever signs are presented, and
  the disclaimer is reinforced in the persistent footer.
- **Accessibility / low cognitive load.** Larger base text (rem-scaled so the
  whole layout stays generous), plain language, AA-contrast tokens, visible
  keyboard focus, reduced-motion support, and minimal choices per screen —
  onboarding picks signs **one domain at a time** (an accordion). The check-in
  also **shortens over time when things are stable**: after a clean streak the
  daily check-in becomes a single tap ("Yes, still steady"), reverting to the
  full check-in the moment anything looks off (`src/lib/checkin.ts`, tested).

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

- **`src/lib/zone.ts`** — `computeZone()`. The pure, well-tested engine, using
  **per-person statistical drift detection** (prototype; no clinical claims):
  - It **learns each person's own baseline** — a personal mean and normal spread
    per signal — from their past check-ins, rather than using fixed thresholds.
  - It flags drift with a **personal z-score** (how far the recent window sits
    above *their* usual, in units of *their* own variation), combined with a
    one-sided **CUSUM change-point detector** over a rolling window — so a
    sustained shift is caught but a single noisy day is not.
  - **Sleep and social withdrawal are weighted the most heavily** (strong early
    signs). Until enough history exists, signals are "warming up" and can't drive
    a zone (`warmingUp` / `baselineReady`).
  - Fully transparent: every `driver` reports its learned `baselineMean`,
    `recentMean`, `sigma`, `z`, `cusum`, whether it `fired`/`drove`, and its
    `share`. No LLM, no clock, no randomness.
  - **"I'm actually okay"**: dismissing an amber nudge records a `ZoneCorrection`
    that folds the affirmed recent levels *gently* into the learned baseline
    (weighted pseudo-observations) — so Anchor stops nagging at that level and
    learns the person's real normal (less alert fatigue). It only ever **relaxes
    amber**: an escalation beyond the affirmed level still flags, and the
    **crisis safeguard** re-checks the raw history and forces red regardless of
    any corrections (`crisisOverride`). The crisis routing is always available —
    "I'm actually okay" appears only in amber (never red), the reach-a-person
    block sits above it, and a quiet "Call your crisis line" link is on every
    page (`CrisisQuickLink`).
  - Tests (`src/lib/zone.test.ts`): steady→green, moderate-sustained→amber,
    large-multi-signal→red, **single-day-noise resisted**, **personalisation**
    (a chronically-poor sleeper isn't flagged for being themselves, while the
    same recent values flag someone whose baseline is good), and cold-start
    warming-up. Run with `npm test`. **`/dashboard` renders this engine** — the
    status card, 7-day trend (now read cumulatively per day) and "what I'm
    watching" list all come from its output.
- **`src/lib/rules-engine.ts`** — `evaluateZone()`. The simpler, original engine:
  count how many signs are present, compare against `baseline.amberAt/redAt`.
  Still pure and inspectable; kept for reference.
- The dashboard shows the per-signal reasons in full (`/dashboard`) — nothing
  about the decision is hidden.
- **`src/app/api/message/route.ts`** — the LLM seam, in production. A **server-side**
  route that calls the Anthropic API (model `claude-opus-4-8`) with a key from
  the `ANTHROPIC_API_KEY` env var — **never exposed to the browser**. It is handed
  the zone engine's output (which signals drifted, and by how much) plus the
  person's own staying-well actions, and returns **only a warm, non-alarming
  message**. Its system prompt hard-enforces: never diagnose, never predict an
  episode, never give medical advice, never catastrophise; reassure that drift
  doesn't mean an episode is coming; encourage reaching a real person. The
  **zone is already decided before this route is called** — the model phrases,
  it never decides. Shown on `/dashboard` **only in amber/red**; if no key is
  configured (or the call fails), the dashboard silently falls back to its
  deterministic, template-based copy.
- **`src/lib/messaging.ts`** — the same boundary expressed for the legacy
  `rules-engine.ts` path: a no-op `phraseMessage()` with a runtime guard that
  throws if the zone is ever changed. Kept as the in-process reference.

> Rule of thumb: the **decision** is always code you can read. The **wording**
> can be made warmer by a model. The two never mix.

> **Configuring the LLM message:** copy `.env.example` to `.env.local` and set
> `ANTHROPIC_API_KEY`. Without it, everything still works — the dashboard just
> uses its deterministic copy instead of the warm phrased note.

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
- **`@anthropic-ai/sdk`** (`claude-opus-4-8`) behind a server-side route, for the
  warm message only — key from `ANTHROPIC_API_KEY`, never client-side
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
npm test           # vitest run (unit tests for the zone engine)
```

## Routes

| Route          | Purpose                                                                 | State |
| -------------- | ----------------------------------------------------------------------- | ----- |
| `/`            | **Public landing page** — warm, honest explanation (how it works, the three promises, who it's for) + a simple **waitlist/interest form** (`/api/waitlist`). Also links into the prototype and to the dashboard. | built |
| `/onboarding`  | A few gentle steps, done **when well**: pick early-warning signs from a starter library and add custom ones, set a baseline + name the three zones in your own words, write staying-well actions, add a trusted circle, and a crisis line. Saves to the local store. | **built** |
| `/checkin`     | A ~30-second daily check-in: sleep (good/okay/poor), mood (1–5), and a quick yes/no on your own early-warning signs. Saves a dated `CheckIn` to the store (re-checking the same day updates that day's record). | built |
| `/dashboard`   | A calm **status card** (zone in your words + specific, gentle copy), a **7-day trend**, and a **"what I'm watching"** signal list — all pulled from the `computeZone` engine. In **amber/red** it leads with **"Reach a person"**: one-tap, consent-gated, pre-filled **Message** to your trusted circle + quick **Call** to your crisis line. | built |
| `/plan`        | Your staying-well plan and crisis plan mirrored back — zones, signs, what helps, trusted circle (with one-tap Message/Call), crisis line. Points to **Your data** for ownership controls. | built |
| `/data`        | **Data-ownership panel**: see everything stored (incl. raw JSON), export it, erase all of it, and control per contact *when* they're reached and *exactly what they can see*. | built |

### "Why this zone?" — the transparency proof

The dashboard status card has a tap-to-open **"Why this zone?"** view (`WhyThisZone` +
`src/lib/explain.ts`). It turns the rules engine's output into plain language — *which*
of the person's own signals moved, *by how much* ("drifted a lot / somewhat / a little"),
and each one's share of the decision — plus the rule itself stated as a percentage and a
line of reassurance. It is **deterministic, straight from `computeZone`, no LLM** — the
feature that proves Anchor mirrors the person's own signs rather than an AI judging them.

### You own your data — a usable feature, not a claim

`/data` makes data sovereignty concrete:

- **See everything** stored about you, in plain rows, with a "raw JSON" expander for the
  full truth — and a clear statement that it lives only in your browser, never on a server.
- **Export** a full copy, or **erase everything** from the device (no account, no copies).
- **Control each contact**: *when* they're reached (`alertAtZone`) and *what they can see* —
  `nudge` (only that you'd like to talk) / `zone` (+ how you're doing) / `signals` (+ which
  signs are showing). That `visibility` setting **drives exactly what a pre-filled message
  reveals** — so the control is real, not cosmetic. Nothing is shared unless you press send.

### Supporter access — consent-gated, read-only (the care-team / NHS wedge)

A family member or care coordinator can see a **read-only summary** — but only
when the person explicitly grants it, and only **zone history + trends**, never
raw private notes.

- **One projection, auditable:** `src/lib/supporter.ts → supporterSummary()` is
  the single source of truth for what a supporter sees: current zone, a 14-day
  zone history, and generic drift-area categories (e.g. "Sleep", "Connection").
  It **never** includes check-in notes, sign names/descriptions, baseline text,
  mood/sleep specifics, contacts, or crisis-plan details — there's a test that
  serialises the summary and asserts none of that private data can leak.
- **Consent + revocation:** off by default. The person grants access in
  `/data` (which generates a token) and can revoke any time — **revoking rotates
  the token**, so any link already shared stops working. They also choose what's
  included (trends, drift areas).
- **The supporter view** lives at `/supporter?token=…` with its own minimal,
  read-only shell (no app nav). Access is gated by `canSupporterAccess()`.
- Prototype scope: the summary is read from the person's device (no backend
  yet), so the link works same-device; the planned Supabase swap makes it
  remotely shareable with the **same projection and the same user control**.

### Amber/red: connect to a human, fast

Anchor's job in amber/red is to **connect the person to a real human — not to be
the help itself**. The `ConnectActions` block (`src/components/ConnectActions.tsx`)
surfaces, in one tap:

- **Message [contact]** — opens the device's own SMS app with a warm, pre-filled
  note (the person reads and sends it themselves; Anchor never sends anything).
  **Consent-gated**: only contacts the person confirmed have agreed, and who have
  a number saved, get a Message action (`src/lib/contact.ts` → `canMessage`).
- **Call** the contact, and quick access to the **crisis line** (prominent in red,
  gentle in amber).

Contacts are filtered to those the person set to be reached **at this zone or
sooner**. The same one-tap actions appear on `/plan` for any time.

### Onboarding flow

`/onboarding` is a single client component (`src/app/onboarding/page.tsx`) that
holds a **draft** `Profile` in memory and only writes to the store when the
person taps *Save my plan*. The tone throughout assumes the person is doing
this on a good day — it opens with *"Best done on a good day"* and frames the
whole exercise as writing a note to your future self.

Steps: **Welcome → Your signs → Your baseline → What helps → Your circle →
Crisis line → Review**.

## Deploying to Vercel

Next.js App Router deploys to Vercel with **zero config** (no `vercel.json` needed).

1. **Import** `ekjots1ngh/Anchor` at [vercel.com/new](https://vercel.com/new) — the
   framework auto-detects as Next.js.
2. **Set the env vars** (Settings → Environment Variables, for Production + Preview):
   - `ANTHROPIC_API_KEY = <your key>` — the `/api/message` route reads it
     **server-side only** (`runtime = "nodejs"`), so the key is never exposed to
     the browser.
   - `WAITLIST_WEBHOOK_URL = <your sink>` *(optional)* — where landing-page
     waitlist submissions are forwarded (Google Sheet via Apps Script, Airtable,
     Formspree, Slack/Discord webhook, Zapier/Make, …). If unset, submissions are
     still captured in the function logs.
   - `NEXT_PUBLIC_DEMO_MODE = 1` *(optional)* — keep the demo panel on the build.
3. **Pick the production branch** (Settings → Git) — either set it to the working
   branch, or merge to `main` and deploy that. Then **Deploy**.
4. **Env var changes require a redeploy** to take effect.

Verify the API route in production once deployed:

```bash
curl -s -X POST https://<your-url>/api/message \
  -H 'content-type: application/json' \
  -d '{"zone":"amber","drivers":[{"label":"Sleep","drift":0.4}],"stayingWellActions":["A short walk"]}'
# → {"message":"…"}   (a 503 "messaging is not configured" means the key isn't set for this env)
```

If the key is unset, the app still works — the dashboard falls back to its
deterministic copy instead of the warm LLM note.

## Demo mode (dev/stage only)

A floating **Demo** panel (`src/components/DemoPanel.tsx`) appears in `npm run dev`
— or on a deployed *preview* when `NEXT_PUBLIC_DEMO_MODE=1` — and never in a normal
production build. It offers two ways to drive a demo:

**▶ Run 2-min walkthrough — scripted presenter mode (for judges).** One tap per
beat takes you **steady → drifting → the warm amber message → connecting to a
human**: each step auto-navigates to the dashboard, sets the data, and
scrolls/highlights the relevant card, with a caption and an elapsed timer.
The seed pre-loads on start, so **nothing depends on live typing**. A persistent
bottom bar shows the step, caption, and Back / Next / Exit. It lives in the root
layout, so it survives navigation.

**Manual controls (for ad-hoc demos):**

1. **Seed steady week** — writes a full demo profile with 12 calm days; the
   dashboard sits **green**.
2. **Tip to amber** — injects dipping sleep + social withdrawal; the dashboard
   tips **green → amber live** (no reload — the store fires a change event and
   `useProfile` re-reads), and the **warm LLM note generates on screen** (with a
   "Finding the right words…" state).
3. **Reset** — wipes the demo data.

The numbers are deterministic and unit-tested (`src/lib/demo.test.ts`): the seed
scores 0 (green), the tip scores ~0.32 — comfortably between the 0.25 amber and
0.5 red thresholds — driven by **Sleep** and **Social withdrawal**, which is also
what the note names. For the LLM note to generate (rather than fall back to
deterministic copy), set `ANTHROPIC_API_KEY`.

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
    │   ├── api/message/route.ts # server-side LLM seam: phrases the warm note (key stays server-side)
    │   ├── onboarding/page.tsx # the gentle multi-step "set up when well" flow
    │   ├── checkin/page.tsx    # mark which signs are present → runs the rules engine
    │   ├── dashboard/page.tsx  # zone (in the person's words) + full inspectable reasons
    │   └── plan/page.tsx       # whole plan mirrored back + export / erase my data
    ├── components/
    │   ├── PageShell.tsx       # page frame, nav, persistent care-not-replace footer
    │   ├── Card.tsx            # soft rounded surface
    │   ├── Button.tsx          # calm pill action
    │   ├── WarmMessage.tsx     # amber/red only: fetches the LLM note, falls back to template copy
    │   ├── ConnectActions.tsx  # amber/red "reach a person" block (circle + crisis line)
    │   ├── ContactActions.tsx  # one-tap Message/Call for a contact (consent-gated)
    │   └── ZoneBadge.tsx       # green / amber / clay badge (no alarm-red variant exists)
    ├── design/
    │   └── tokens.ts           # per-zone style tokens + spacing/radius, in code
    └── lib/
        ├── types.ts            # core domain types — no "diagnosis"/"severity" anywhere
        ├── starter-library.ts  # small starter sign library + default zone words + crisis line
        ├── zone.ts             # drift-over-window zone engine — pure, explainable, no LLM
        ├── zone.test.ts        # unit tests: steady / amber / red + windowing + drivers
        ├── dashboard.ts        # turns zone-engine output into calm copy + 7-day trend (no LLM)
        ├── contact.ts          # tel:/sms: links, pre-filled message, consent gating (+ tests)
        ├── rules-engine.ts     # simpler count-based zone engine (kept for reference)
        ├── messaging.ts        # the ONLY place an LLM may touch — wording only
        ├── store.ts            # local (localStorage) store; swappable for Supabase later
        └── useProfile.ts       # client hook to read the saved profile after hydration
```

Tests use **Vitest** (`vitest.config.ts`); `@/…` path aliases resolve via the
config's `resolve.alias`.

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
