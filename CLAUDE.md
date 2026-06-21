# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Anchor is a calm "staying-well" companion (hackathon prototype) for people managing
psychosis/schizophrenia relapse. It mirrors a person's *own* pre-agreed early-warning
signs back to them and helps them reach a real human. Next.js 14 App Router +
TypeScript + Tailwind, deployed on Vercel. Read `README.md` (product + safety framing)
and `DESIGN.md` (the design system) before non-trivial work.

## Commands

```bash
npm run dev          # local dev server, http://localhost:3000
npm run build        # production build (also the best full sanity check; SSR-renders every route)
npm run lint         # next lint
npm run typecheck    # tsc --noEmit
npm test             # vitest run (all tests once)
npm run test:watch   # vitest watch
npx vitest run src/lib/zone.test.ts        # a single test file
npx vitest run -t "crisis safeguard"       # tests matching a name
npm run waitlist     # print waitlist sign-ups (add `-- --json` for raw)
```

Before committing, run `typecheck`, `lint`, `test`, and `build` — they're all expected
to pass. Tests live next to their module (`src/lib/*.test.ts`), run in the `node`
environment, and resolve `@/` → `src/` (see `vitest.config.ts`; mirrors the tsconfig
path alias).

## Architecture — the parts that span files

### The safety boundary: the rule decides, the model only phrases
This is the load-bearing invariant. **The zone (green/amber/red) is ALWAYS decided by
the transparent, deterministic rules engine — never by an LLM.**

- `src/lib/zone.ts` — `computeZone()` / `computeZoneForProfile()`: a pure, tested,
  per-person statistical drift engine (personal baseline + z-score + CUSUM change-point
  over a rolling window). No network, no randomness, no model. It returns the zone *and*
  which signals drove it. Includes a **crisis safeguard**: corrections can only relax
  amber; the engine re-checks raw history and forces red regardless (`crisisOverride`).
- `src/app/api/message/route.ts` + `src/lib/messaging.ts` — the LLM's ONLY job: rephrase
  a warm message for an already-decided amber/red zone. Server-side only
  (`ANTHROPIC_API_KEY`, `runtime = "nodejs"`, model `claude-opus-4-8`). If the key is
  missing it returns 503 and the UI falls back to deterministic copy.
- `src/lib/dashboard.ts` / `src/lib/explain.ts` / `src/lib/rules-engine.ts` — deterministic
  presentation: status copy, the "Why this zone?" plain-language story, trend.

When touching anything zone-related: keep the decision in code, keep the model confined
to wording, and keep the engine pure (it has the most tests — `zone.test.ts`).

### Local-first store and live updates
- `src/lib/types.ts` — the `Profile` is the single state object (signs, zones in the
  person's own words, baseline, checkIns, journal, corrections, trusted contacts, crisis
  plan, sharing). Add new persisted state here.
- `src/lib/store.ts` — localStorage-backed (swappable for Supabase later). `saveProfile`/
  `clearProfile` dispatch `PROFILE_CHANGED_EVENT`. `createEmptyProfile()` is the canonical
  shape — **any new required `Profile` field must be added there AND in `src/lib/demo.ts`'s
  profile builder**, or types/tests break.
- `src/lib/useProfile.ts` — re-reads on `PROFILE_CHANGED_EVENT`, so a write anywhere
  updates every screen live. UI pages are client components reading through this hook.

### Consent-gated projections (data sovereignty)
Sharing is done through single, auditable, "leak-nothing" projection functions, each with
a no-leak test. Reuse these; do not build parallel sharing paths.
- `src/lib/supporter.ts` — `supporterSummary()`: read-only zones/trends a token-holding
  supporter sees (`/supporter?token=…`); never raw notes.
- `src/lib/journal.ts` — `sharedJournal()`: the only projection of journal entries a
  clinician may see. Private by default; per-entry `sharing` = private/summary/full;
  `/summary` reuses this. **Never add automated scanning/AI-flagging of journal text.**

### Design system (read DESIGN.md)
- Colour is **semantic, CSS-variable-backed tokens** defined in `src/app/globals.css`
  (light + dark via `prefers-color-scheme`) and mapped in `tailwind.config.ts`. Use roles
  (`bg-surface`, `text-ink-muted`, `bg-accent`, `text-steady-text`, `bg-drifting-soft`,
  `text-crisis-text`, …). **Do NOT use numbered Tailwind shades or `dark:` variants** —
  dark mode is automatic through the variables, and numbered shades break it.
- Type: Inter (`--font-sans`, the interface) + Source Serif 4 (`font-serif`, reserved for
  the *companion voice* — warm message, status headline, welcome). Loaded in `layout.tsx`.
- `src/design/tokens.ts` is the single source of truth for zone presentation
  (`ZONE_STYLES`) and the shared `inputClass`. Primitives: `Button`, `Chip`, `Card`,
  `PageShell` (frame + nav + skip link + persistent disclaimer + footer `ReachSupport`).

## Project-specific conventions (easy to violate)

- **No engagement mechanics.** No streak counts, no nagging, no penalty for missed days.
  Wellbeing over time-in-app. (The internal `stableStreak` exists only to *shorten* the
  check-in; never surface it as a score.)
- **No em-dashes/en-dashes in user-facing copy.** Use commas, full stops, colons, or
  parentheses. The `/api/message` system prompt also forbids them in generated text.
- **Calm, non-clinical, validating tone.** The crisis colour is a dignified clay, never an
  alarm red; the crisis path (`ReachSupport`, footer `#reach-support`) is always available
  on every onboarded screen.
- **Accessibility is part of the system:** ~17px rem base that scales with the OS, AA
  contrast in both themes, skip link, `aria-current` nav, ≥44px tap targets, and all motion
  gated behind `prefers-reduced-motion`.
- New `Profile` fields that hold health data: add the production TODO note (encryption at
  rest, consent audit trail, UK GDPR special-category) alongside the existing ones in
  `store.ts`/`journal.ts` rather than implying the prototype handles it.

## Sandbox / environment notes

- The Anthropic API and font fetching work at build time; long-lived backgrounded servers
  get killed, so verify with `npm run build` (it SSR-renders every route) rather than
  trying to keep a dev server running to "see" a page.
- Optional env (all in `.env.example`): `ANTHROPIC_API_KEY` (warm message),
  `NEXT_PUBLIC_DEMO_MODE=1` (presenter panel on a deployed build), `ADMIN_TOKEN`
  (`/admin` waitlist view), Vercel KV vars (durable waitlist), `WAITLIST_WEBHOOK_URL`.
