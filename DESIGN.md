# Anchor — Design System

**Direction: calm, warm, and grown-up.** Anchor is for people managing a serious
health condition, so the interface has to earn trust: warm and human, but credible
and adult. Not clinical or cold; not childish, not pastel-and-blobs. The reference
genre is mature, clinically-serious wellbeing products — considered restraint over
decoration.

Five principles drive every decision below:

1. **Warmth without softness of mind.** Warm paper, ink, one grounded accent. No
   candy colours, no emoji-bright status lights.
2. **Quiet depth.** Structure comes from fine borders and gentle surface tints, not
   heavy drop-shadows. The page should feel flat, layered, and still.
3. **One voice, two registers.** A humanist sans is the *interface*; a warm serif is
   the *companion voice* (the message Anchor speaks to you). They never blur.
4. **Calm status, never alarm.** Zone colour reassures. The crisis colour is a
   dignified clay, never an emergency red.
5. **Accessible by construction.** Every text/background pair is AA in both light and
   dark. Type scales with the OS. Motion is optional.

---

## Colour

Colour is defined as **semantic tokens** (CSS custom properties in
`src/app/globals.css`), mapped to Tailwind names in `tailwind.config.ts`. Components
never hard-code hex or numbered shades — they use roles like `bg-surface`,
`text-ink-muted`, `bg-accent`, `text-steady-text`. Because the tokens are variables,
**dark mode is automatic** (`prefers-color-scheme`) and there are no `dark:` variants
scattered through the app.

### Neutrals — warm paper & ink

| Role | Light | Dark | Use |
|---|---|---|---|
| `canvas` | warm paper `#F6F4EF` | warm charcoal `#1B1A17` | page background |
| `surface` | `#FCFBF7` | `#232220` | cards, raised panels |
| `raised` | `#EEEAE1` | `#2D2B27` | inset tints, progress tracks |
| `ink` | `#2A2925` | `#ECE8DF` | primary text (never pure black/white) |
| `ink-muted` | `#5A574F` | `#B4AFA3` | secondary text — AA |
| `ink-faint` | `#6E6B61` | `#948F84` | captions — AA |
| `line` | `#E4E0D6` | `#38352F` | hairline borders |
| `line-strong` | `#D2CDBF` | `#4A463E` | emphasised borders |

### Accent — one grounded calm: **deep muted teal**

We commit to a single accent and use it everywhere interactive: primary buttons,
links, active nav, focus rings, the brand mark. Teal reads as composed, credible, and
adult, and it sits apart from the zone colours (so *brand* and *status* never get
confused — a deliberate separation). It is complementary to the clay crisis colour,
which gives the palette its quiet sophistication.

| Role | Light | Dark |
|---|---|---|
| `accent` (solid) | `#2A655F` | `#5FA79E` |
| `accent-strong` (hover) | `#234F4A` | `#74B6AD` |
| `accent-soft` (tint bg) | `#E3EDEB` | `#21302E` |
| `accent-text` (on canvas, AA) | `#235A55` | `#7CBDB4` |
| `accent-foreground` (on solid) | `#FBF9F4` | `#10201D` |

### Zones — calm status, never alarm

Status is its own family, all low-saturation and earthy. Each zone carries a
`-soft` tint, a readable `-text`, a `solid` (dots/bars), and a `-border`.

| Zone | Meaning | Solid (light/dark) | Text (light/dark) |
|---|---|---|---|
| `steady` — sage | doing okay | `#6E8B72` / `#84A589` | `#3E5A45` / `#9CC0A1` |
| `drifting` — warm ochre | worth a gentle check-in | `#C99A3F` / `#D8B05A` | `#7A5A1E` / `#E1C27E` |
| `crisis` — clay | a harder stretch, real support | `#B5745A` / `#C98A6E` | `#8A4A36` / `#E2A88E` |

The crisis "Call" action uses `crisis-strong` as a filled button — warm and clear,
deliberately **not** an alarm red. Every zone `-text` on `canvas` and on its own
`-soft` clears AA in both themes.

---

## Type

A real pairing, both freely licensed (OFL) and loaded via `next/font`:

- **Inter** (humanist sans) — the entire interface: nav, labels, buttons, data,
  body. Neutral, legible, modern. `--font-sans`.
- **Source Serif 4** (warm transitional serif) — the **companion voice** only: the
  warm message Anchor writes, the status headline, and the welcome/landing moments
  where Anchor speaks to a person. It signals "a human wrote this," not "a system
  reported this." `--font-serif`, applied with `font-serif`.

Keeping the serif rare is the point — it stays special.

### Scale

Base is **106.25% (~17px)** on `<html>`, in rem, so it scales with the OS setting.
Body line-height **1.65**.

| Token | Size | Weight | Tracking | Used for |
|---|---|---|---|---|
| Display | `text-4xl`–`text-5xl` | 600 | `-tracking-tight` | landing hero (serif) |
| Title (h1) | `text-3xl`–`text-4xl` | 600 | `-tracking-tight` | page titles |
| Voice | `text-xl`–`text-2xl` | 400–600 | normal | warm message / status (serif) |
| Section (h2) | `text-lg`–`text-xl` | 600 | normal | card headings |
| Body | `text-base` | 400 | normal | paragraphs |
| Small | `text-sm` | 400–500 | normal | hints, meta |
| Caption | `text-xs` | 500 | `tracking-wide` (uppercase labels) | eyebrows |

---

## Space & shape

- **Spacing rhythm.** A 4px base. Cards pad `1.5rem`/`2rem` (`p-6 sm:p-8`); screen
  sections stack on `space-y-8`; the page frame breathes at `py-12 sm:py-16`. Generous
  whitespace is a feature, not waste.
- **Shape.** Soft, not bubbly: cards `1.25rem`, inputs/inner tiles `1rem`
  (`rounded-2xl`), buttons and chips full `pill`. Consistent everywhere.
- **Depth.** One whisper-soft shadow (`shadow-card`) reserved for cards; everything
  else is fine borders (`line`) and surface tints. In dark mode, borders carry the
  structure.

---

## Components

A small set, all drawn from the tokens, in `src/components`:

- **Card** (`Card.tsx`) — `surface` + `line` + `shadow-card`, the basic unit.
- **Button** (`Button.tsx`) — variants `primary` (accent solid), `secondary` (accent
  outline), `quiet` (ghost), `danger` (clay outline). One radius, one focus ring.
- **Chip** (`Chip.tsx`) — pill tag, neutral or tonal (`accent`/zone) for status.
- **Input** (`Input.tsx` / `inputClass`) — `surface`, `line`, accent focus ring.
- **ZoneBadge** (`ZoneBadge.tsx`) and **zone cards** — driven by `ZONE_STYLES` in
  `src/design/tokens.ts`, the single source of truth for zone presentation.

---

## Journal — privacy-first

A calm, free-text journal (`/journal`) for thoughts and how a person is doing.
Optional, ignorable prompts; no word counts, no streaks, no pressure. Built on
the tokens (Inter for the interface, Source Serif for the prompt/voice moments).

**Privacy model.**

- **Private by default.** Every entry starts private and belongs to the person.
  Browse, edit, and delete are always available.
- **No surveillance.** Anchor does **not** scan, summarise, or AI-flag journal
  text. Analysing private thoughts silently would break trust — so we don't.
- **Granular, revocable sharing.** Per entry, the person may keep it private,
  share a **summary only** (the clinician summary notes a date — never the text),
  or share the **full entry** (read-only). Each entry shows its state clearly and
  can be revoked at any time.
- **One path, reused.** `sharedJournal()` (`src/lib/journal.ts`) is the single,
  tested projection of what a clinician may see; the consent-gated clinician
  summary (`/summary`) reuses it. The clinician sees only what was explicitly
  shared — private and summary-only text never leave the device.
- **Always-available support.** The journal keeps a quiet "find support now"
  link to the calm `#reach-support` block — never an alarm.

**⚠️ Production data TODO (do not ship with real users).** Journal text — and any
entry a person shares — is **special-category health data under UK GDPR (Art. 9)**.
This prototype stores plaintext in `localStorage`. A production version needs:
(1) **encryption at rest**; (2) a **consent audit trail** (append-only log of each
share/revoke, separate from the mutable flag); (3) a recorded **lawful basis +
explicit consent** for processing/sharing health data, with data-subject rights
honoured server-side. Flagged in `src/lib/store.ts` and `src/lib/journal.ts`.

---

## Motion & accessibility

- One **content settle** (a soft fade + 6px rise) and gentle colour transitions on
  interactive elements. Everything is disabled under `prefers-reduced-motion: reduce`.
- A keyboard **skip link**, a focusable `main`, `aria-current` nav, AA focus rings on
  the accent, and large (≥44px) tap targets are part of the system, not afterthoughts.
- All colour pairs are verified AA in light and dark.
