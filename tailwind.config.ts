import type { Config } from "tailwindcss";

/**
 * Anchor design tokens — see DESIGN.md.
 *
 * Colours are SEMANTIC and variable-backed. Every value here points at a CSS
 * custom property defined in src/app/globals.css, which flips automatically for
 * dark mode (prefers-color-scheme). Components reference roles — bg-surface,
 * text-ink-muted, bg-accent, text-steady-text — never numbered shades, so the
 * whole app themes from one place and there are no scattered `dark:` variants.
 *
 * Direction: calm, warm, grown-up. One grounded accent (deep muted teal); zone
 * colours stay low-saturation and reassuring; the crisis colour is a dignified
 * clay, never an alarm red.
 */
const v = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: v("--canvas"),
        surface: v("--surface"),
        raised: v("--raised"),
        ink: {
          DEFAULT: v("--ink"),
          muted: v("--ink-muted"),
          faint: v("--ink-faint"),
        },
        line: {
          DEFAULT: v("--line"),
          strong: v("--line-strong"),
        },
        // Brand / interactive: one grounded accent.
        accent: {
          DEFAULT: v("--accent"),
          strong: v("--accent-strong"),
          soft: v("--accent-soft"),
          text: v("--accent-text"),
          foreground: v("--accent-foreground"),
        },
        // Zone: STEADY — sage.
        steady: {
          DEFAULT: v("--steady"),
          soft: v("--steady-soft"),
          text: v("--steady-text"),
          border: v("--steady-border"),
        },
        // Zone: DRIFTING — warm ochre.
        drifting: {
          DEFAULT: v("--drifting"),
          soft: v("--drifting-soft"),
          text: v("--drifting-text"),
          border: v("--drifting-border"),
        },
        // Zone: CRISIS — dignified clay. Warm, never an alarm red.
        crisis: {
          DEFAULT: v("--crisis"),
          soft: v("--crisis-soft"),
          text: v("--crisis-text"),
          border: v("--crisis-border"),
          strong: v("--crisis-strong"),
          foreground: v("--crisis-foreground"),
        },
      },
      borderRadius: {
        card: "1.25rem",
        pill: "9999px",
      },
      boxShadow: {
        // One whisper-soft elevation, reserved for cards. Quiet depth.
        card: "0 1px 2px rgb(20 18 14 / 0.03), 0 10px 28px -14px rgb(20 18 14 / 0.12)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },
      maxWidth: {
        content: "44rem",
      },
    },
  },
  plugins: [],
};

export default config;
