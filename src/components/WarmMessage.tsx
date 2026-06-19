"use client";

import { useEffect, useState } from "react";
import type { ZoneId } from "@/lib/types";

/**
 * Shows a warm, LLM-phrased note on the dashboard — ONLY in amber/red.
 *
 * The zone has already been decided by the rules engine. This component asks
 * the server-side /api/message route (which calls the Anthropic API with a
 * key that never leaves the server) to phrase a warm message about what has
 * drifted and what has helped before. If that call isn't available — no API
 * key configured, offline, or an error — it silently shows the deterministic
 * `fallback` copy instead, so the dashboard always reads gently.
 */
export function WarmMessage({
  zone,
  zoneLabel,
  drivers,
  stayingWellActions,
  firstName,
  fallback,
  className = "",
}: {
  zone: Extract<ZoneId, "amber" | "red">;
  zoneLabel?: string;
  drivers: { label: string; drift: number }[];
  stayingWellActions: string[];
  firstName?: string;
  fallback: string;
  className?: string;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Stable signature so we only re-request when the inputs actually change.
  const signature = JSON.stringify({ zone, drivers, stayingWellActions });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setMessage(null);
    fetch("/api/message", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ zone, zoneLabel, drivers, stayingWellActions, firstName }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.message) setMessage(data.message as string);
      })
      .catch(() => {
        /* fall back to deterministic copy */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  // While the note is being written, show a calm "generating" line so the
  // person sees a warm message forming (rather than a flash of fallback copy).
  if (loading) {
    return (
      <p
        className={`flex items-center gap-2 text-lg leading-relaxed text-ink-faint ${className}`}
        aria-live="polite"
      >
        <span className="inline-block h-2 w-2 animate-pulse rounded-pill bg-checkin-400" aria-hidden />
        Finding the right words&hellip;
      </p>
    );
  }

  return (
    <p className={`text-lg leading-relaxed text-ink-muted ${className}`} aria-live="polite">
      {message ?? fallback}
    </p>
  );
}
