import { ZONE_STYLES } from "@/design/tokens";
import type { ZoneId } from "@/lib/types";

const FALLBACK_LABELS: Record<ZoneId, string> = {
  green: "Green",
  amber: "Amber",
  red: "Red",
};

/**
 * The visual representation of a zone. Sage for green, amber for amber, muted
 * clay for red. By design there is no alarm-red variant. Pass `label` to show
 * the person's own word for the zone.
 */
export function ZoneBadge({ zone, label }: { zone: ZoneId; label?: string }) {
  const style = ZONE_STYLES[zone];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-pill px-4 py-1.5 text-sm font-medium ${style.badgeBg} ${style.badgeText}`}
    >
      <span className={`h-2 w-2 rounded-pill ${style.dot}`} aria-hidden />
      {label ?? FALLBACK_LABELS[zone]}
    </span>
  );
}
