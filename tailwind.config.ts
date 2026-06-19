import type { Config } from "tailwindcss";

/**
 * Anchor design tokens.
 *
 * Calm by design. Three "zone" colours, none of them alarming:
 *   - steady  → muted sage-green  (zone "green":  the person is anchored)
 *   - checkin → warm amber        (zone "amber":  worth a check-in)
 *   - crisis  → muted clay        (zone "red":    real support, now)
 *
 * The "red" zone is a dignified, muted clay/terracotta — deliberately NOT an
 * emergency red. Anchor never shouts at a person about their own mental
 * health. See README → "Design principles".
 */
const config: Config = {
  content: [
    // Scan all of src so class strings declared in design tokens and lib
    // helpers (e.g. ZONE_STYLES) are not purged.
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Soft neutral canvas + surfaces.
        canvas: "#f5f4ef", // warm off-white background
        surface: "#fffdf9", // raised card surface
        ink: {
          DEFAULT: "#3a3a34", // primary text, soft near-black
          muted: "#6f6e66", // secondary text
          faint: "#9a988e", // captions / hints
        },
        line: "#e7e4db", // hairline borders

        // Zone: STEADY — muted sage-green.
        steady: {
          50: "#f1f5f1",
          100: "#dfe9e0",
          200: "#c4d6c6",
          300: "#a3bfa6",
          400: "#7c9885", // primary sage
          500: "#65806e",
          600: "#506859",
          700: "#3f5246",
        },

        // Zone: CHECK-IN — warm amber (gentle, never alarming).
        checkin: {
          50: "#fbf3e7",
          100: "#f5e3c8",
          200: "#ecca97",
          300: "#e0b06a",
          400: "#d49a4e", // primary amber
          500: "#bb8038",
          600: "#98662c",
          700: "#755024",
        },

        // Zone: CRISIS / RED — muted clay/terracotta. Serious and warm, NOT
        // an alarm red. This is the "real support, now" zone, kept dignified.
        crisis: {
          50: "#f7efea",
          100: "#ecdacf",
          200: "#dcb8a6",
          300: "#c9947c",
          400: "#b5745a", // primary clay
          500: "#9c5e47",
          600: "#7e4b39",
          700: "#613a2d",
        },
      },
      borderRadius: {
        card: "1.25rem",
        pill: "9999px",
      },
      boxShadow: {
        // Very soft, low-contrast elevation. Nothing harsh.
        card: "0 1px 2px rgba(58,58,52,0.04), 0 8px 24px rgba(58,58,52,0.06)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      spacing: {
        // Generous rhythm helpers.
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
