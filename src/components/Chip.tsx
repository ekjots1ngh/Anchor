import type { ReactNode } from "react";

type Tone = "neutral" | "accent" | "steady" | "drifting" | "crisis";

const tones: Record<Tone, string> = {
  neutral: "bg-raised text-ink-muted",
  accent: "bg-accent-soft text-accent-text",
  steady: "bg-steady-soft text-steady-text",
  drifting: "bg-drifting-soft text-drifting-text",
  crisis: "bg-crisis-soft text-crisis-text",
};

/** A small pill tag — neutral, or tonal for status. Drawn from the tokens. */
export function Chip({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-pill px-3 py-1 text-sm font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
