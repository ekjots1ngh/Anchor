import { ZONES, type Zone } from "@/design/tokens";

/**
 * The visual representation of a zone. Sage for steady, amber for
 * worth-a-check-in. By design there is no red / alarm variant.
 */
export function ZoneBadge({ zone }: { zone: Zone }) {
  const token = ZONES[zone];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-pill px-4 py-1.5 text-sm font-medium ${token.classes.badgeBg} ${token.classes.badgeText}`}
    >
      <span
        className={`h-2 w-2 rounded-pill ${token.classes.accentBar}`}
        aria-hidden
      />
      {token.label}
    </span>
  );
}
