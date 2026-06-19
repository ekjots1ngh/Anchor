import type { Config } from "tailwindcss";

/**
 * Anchor design tokens.
 *
 * Calm by design. Two and only two "zone" colours:
 *   - steady  → muted sage-green  ("things look steady")
 *   - checkin → warm amber        ("might be worth a check-in")
 *
 * There is deliberately NO red / alarm colour. Anchor never shouts at a
 * person about their own mental health. See README → "Design principles".
 */
const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
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
