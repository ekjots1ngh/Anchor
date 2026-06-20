# Anchor

**A calm, staying-well companion for people managing psychosis or schizophrenia relapse.**

Anchor mirrors a person’s *own* pre-agreed early-warning signs back to them, and helps them reach real human support when those signs drift from their normal. It’s designed to feel calm on a hard day.

> ⚠️ **What Anchor is _not_.** Anchor is an **unvalidated prototype, not a medical device** and **not a diagnostic tool**. It makes no medical claims, doesn’t diagnose, and doesn’t predict episodes. It is built to **support clinical care, never to replace it**. If you are in crisis, contact your care team or local emergency services.

---

## What it is

Anchor is a small web app built around one idea: the person decides, while well, what *their* early-warning signs are — in their own words — and Anchor quietly watches for those, and only those.

- **Set up on a good day.** With (ideally) their care team, the person chooses early-warning signs from five staying-well domains — sleep, social, thinking, function, mood — grounded in established relapse-prevention / staying-well-plan frameworks (e.g. WRAP). They rewrite them in their own words.
- **A 30-second daily check-in.** How they slept, their mood, and whether any of *their* signs are around. When things are steady, the check-in shortens to a single tap.
- **Mirrored back, with help nearby.** If their signs drift from their personal baseline, Anchor reflects that back calmly and helps them reach a real person — a friend, family member, or their care team.

---

## Architecture: the rule decides, the model only phrases

This is the most important design decision in the project, and it exists for safety.

```
 check-ins ─▶ ┌──────────────────────────────┐  zone + which signals drove it
              │  TRANSPARENT RULES ENGINE     │ ───────────────────────────────▶  UI
              │  src/lib/zone.ts (pure, tested)│
              └──────────────────────────────┘
                                                  the decided zone + drivers
                                                          │
                                                          ▼
              ┌──────────────────────────────┐
              │  LLM — ONLY phrases a message │   warm, non-alarming wording
              │  src/app/api/message/route.ts │ ───────────────────────────────▶  UI
              └──────────────────────────────┘   (amber/red only; falls back to
                                                  deterministic copy if absent)
```

**The zone (green / amber / red) is _always_ decided by a transparent, inspectable rules engine — never by an LLM.** The engine (`src/lib/zone.ts`, `computeZone`) is pure and deterministic: same inputs → same output, no network, no randomness, no model. Per signal it:

1. **Learns the person’s own baseline** — a personal mean and normal spread from their past check-ins (floored so a perfectly-steady history isn’t hair-trigger). Too little history → the signal is “warming up” and can’t drive a zone.
2. **Scores drift with a personal z-score** — how far the recent window sits above *their* usual, in units of *their own* variation.
3. **Confirms it’s a real shift, not noise, with a one-sided CUSUM change-point detector** over a rolling window. A single bad day can’t trip it; a sustained shift can.
4. **Weights sleep and social withdrawal the most heavily** (strong early signs), then maps the weighted result to a zone.

Every result is fully **explainable**: each driver reports its learned baseline, recent level, z-score, whether the CUSUM fired, whether it drove the zone, and its share. The dashboard’s “**Why this zone?**” view renders that in plain language.

**The LLM is allowed exactly one job: rephrasing the human-facing message** (`/api/message`, model `claude-opus-4-8`, server-side only). It is handed the zone the engine already decided plus which signals drifted, and returns *only* a warm, non-alarming sentence or two. Its system prompt forbids diagnosing, predicting episodes, giving medical advice, or catastrophising. If there’s no API key, the dashboard falls back to deterministic template copy — the app still works.

**Why the separation matters.** A person’s “are my early-warning signs showing?” decision must be auditable, reproducible, and owned by them and their clinicians — not delegated to a black box. So the **decision** is always code you can read; the **wording** can be made warmer by a model. The two never mix.

---

## Safety design

Safety isn’t a banner — it’s built into the data model and the tests.

- **You own your data.** Everything lives in the person’s browser (`localStorage`), never sent to a server. The `/data` panel lets them **see everything stored** (readable summary + raw JSON), **export** it, and **erase all of it** — no account, no copies kept.
- **Consent-gated supporter view.** A family member or care coordinator can see a **read-only summary** at `/supporter?token=…` — but only when the person turns it on, and only **zone history + trends + generic drift-area labels**, *never raw private notes*. One auditable projection (`src/lib/supporter.ts`) is the single source of truth for what a supporter sees. Revoking rotates the token, so any link already shared stops working.
- **The crisis path is always available.** A quiet “Call your crisis line” link is in the footer on **every page** once onboarded; in amber/red the dashboard leads with one-tap, consent-gated ways to reach a real person.
- **Dismissals can’t silence a crisis.** An “**I’m actually okay**” correction gently tunes the baseline to reduce alert fatigue — but it can only *relax amber*. The engine re-checks the raw history and **forces red regardless of any correction** (a `crisisOverride`), so a genuine crisis is never dismissed away.

### All of this is unit-tested — **32 tests, all passing**

```
src/lib/zone.test.ts        12   per-person engine: steady→green, sustained→amber, large→red,
                                 single-day-noise resistance, personalisation, warming-up,
                                 and the CRISIS SAFEGUARD (red stands under a pile of dismissals)
src/lib/supporter.test.ts    6   access gating + the NO-PRIVATE-DATA-LEAK test (serialises the
                                 supporter projection and asserts none of 14 planted secrets appear)
src/lib/contact.test.ts      6   consent-gating + visibility-shaped pre-filled messages
src/lib/checkin.test.ts      5   adaptive check-in: shortens only after a steady streak, reverts on a rough day
src/lib/demo.test.ts         3   deterministic demo seed: green → amber, driven by sleep + social
```

Run them with `npm test`.

---

## Tech stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · `localStorage` store (swappable for Supabase later) · `@anthropic-ai/sdk` (`claude-opus-4-8`, server-side only) · deployed on Vercel.

---

## Quickstart

```bash
npm install
npm run dev        # http://localhost:3000

npm test           # 32 unit tests (Vitest)
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
npm run build      # production build
```

### Environment variables

Copy `.env.example` → `.env.local`. All are optional — the app runs without them.

| Variable | What it does |
|---|---|
| `ANTHROPIC_API_KEY` | Enables the warm LLM message in amber/red. **Server-side only — never exposed to the browser.** Without it, the dashboard uses deterministic copy. |
| `NEXT_PUBLIC_DEMO_MODE` | Set to `1` to show the demo / **▶ 2-minute presenter walkthrough** panel on a deployed build (it always shows in local `npm run dev`). |
| `ADMIN_TOKEN` | Protects the `/admin` waitlist view and `npm run waitlist`. Open `/admin?key=<token>` to see sign-ups. |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Durable waitlist storage. Connect a **Vercel KV** store (Storage → Create → KV) and these are injected automatically — sign-ups persist to Redis. Without them, sign-ups go to a local file (dev) + the server logs. |
| `WAITLIST_WEBHOOK_URL` | Optional *extra* sink for waitlist submissions (Google Sheet / Airtable / Slack …), in addition to the durable store. |

**Waitlist sign-ups are persisted durably** (`src/lib/waitlist-store.ts`) and retrievable two ways: the protected **`/admin?key=…`** page, or **`npm run waitlist`** (add `-- --json` for raw). For real signal on Vercel, connect a KV store (one click) — locally it uses a file.

### Deploy (Vercel, zero-config)

1. Import the repo at [vercel.com/new](https://vercel.com/new) — Next.js auto-detected.
2. Add the env vars above (Production + Preview), then **Deploy**. Env changes need a redeploy.

### See it in 2 minutes

In `npm run dev` (or a build with `NEXT_PUBLIC_DEMO_MODE=1`), click **▶ Run 2-min walkthrough** (bottom-right) and tap **Next** four times: **steady → drifting → the warm amber message → reaching a human**. The seed pre-loads, so nothing depends on live typing.

---

## Routes

| Route | What it is |
|---|---|
| `/` | Public landing page — warm, honest explanation + waitlist/interest form |
| `/onboarding` | Set up your own signs, baseline, what helps, trusted circle, crisis line |
| `/checkin` | The ~30-second daily check-in (shortens to one tap when steady) |
| `/dashboard` | Your zone (in your words) + “Why this zone?” + 7-day trend + reach a human |
| `/plan` | Your staying-well & crisis plan, mirrored back |
| `/data` | See / export / erase your data; control the consent-gated supporter view |
| `/summary` | A plain-language, printable summary to talk through at an appointment |
| `/supporter?token=…` | The read-only summary a supporter sees (zones & trends only) |
| `/api/message` | Server-side: phrases the warm note (LLM) — never decides the zone |
| `/api/waitlist` | Server-side: captures landing-page interest (durable store) |
| `/admin?key=…` | Protected view of waitlist sign-ups (token = `ADMIN_TOKEN`) |

---

## How it maps to the bounties

Honest mappings — what Anchor actually does, and where the fit is looser.

- **Vercel.** Built and deployed on Vercel: Next.js 14 App Router with serverless API routes (`/api/message`, `/api/waitlist`), zero-config deploy, and the LLM call kept strictly server-side so the key never reaches the browser.
- **FLock (sovereign AI / data sovereignty).** A core theme, not a bolt-on: the person’s data lives on their device and is theirs to export or erase; the **AI never makes the decision** (a transparent rule does, the model only phrases); and any sharing is **consent-gated, read-only, and minimal**, via one auditable projection that’s tested to leak nothing private.
- **Solvimon (billing / commercialisation).** Anchor’s go-to-market wedge is **care teams / the NHS as the buyer** — the consent-gated supporter view is the B2B entry point, which fits a per-seat / usage-based subscription that billing infrastructure like Solvimon serves. *(Honest scope: this is the monetisation model, not a built Solvimon integration.)*
- **Bilt (rewards / loyalty).** The most tentative fit, and a deliberate non-goal. For vulnerable users, engagement mechanics are a risk, not a feature: Anchor shows **no streaks, no day-counts, no nagging**, and missing days is met with warmth, never penalty. We would not bolt a rewards loop onto a mental-health check-in, so there is nothing gamified here to reward.

---

## Status & honesty

This is a hackathon prototype. The zone engine, safety guarantees, and data model are real and unit-tested; the data store is local (`localStorage`) and the supporter view is same-device until a backend (Supabase) is added — the read-only projection and the user’s control over it stay exactly the same. Anchor makes no clinical claims and is not for clinical use.

## License

[MIT](./LICENSE).
