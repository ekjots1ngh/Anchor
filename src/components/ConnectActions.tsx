import { Card } from "@/components/Card";
import { ContactActions } from "@/components/ContactActions";
import { ZONE_STYLES } from "@/design/tokens";
import { zoneRank } from "@/lib/dashboard";
import { telHref } from "@/lib/contact";
import type { Profile, ZoneId } from "@/lib/types";

/**
 * The amber/red "reach a person" block. Anchor's job in these zones is to
 * connect the person to a real human fast — not to be the help itself — so
 * this surfaces one-tap messaging to their trusted circle (those set to be
 * reached at this zone or sooner) plus quick access to their crisis line.
 */
export function ConnectActions({
  profile,
  zone,
  zoneLabel,
  signalLabels,
  id,
}: {
  profile: Profile;
  zone: Extract<ZoneId, "amber" | "red">;
  /** The person's own word for this zone, and the signals drifting — used to
   *  pre-fill messages, filtered per contact by their visibility setting. */
  zoneLabel?: string;
  signalLabels?: string[];
  id?: string;
}) {
  const reachable = profile.trustedContacts.filter(
    (c) => c.consent && zoneRank(c.alertAtZone) <= zoneRank(zone),
  );
  const { crisisLineName, crisisLinePhone } = profile.crisisPlan;

  return (
    <Card id={id} className={`${ZONE_STYLES[zone].softBg} ring-1 ${ZONE_STYLES[zone].ring}`}>
      <h2 className="text-xl font-semibold">Reach a person</h2>
      <p className="mt-1 text-sm leading-relaxed text-ink-muted">
        The most helpful thing right now is talking to someone real. Anchor is
        just the nudge, and these reach a human in one tap.
      </p>

      {reachable.length > 0 ? (
        <ul className="mt-5 space-y-3">
          {reachable.map((c) => (
            <li key={c.id} className="rounded-2xl border border-line bg-surface px-5 py-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium text-ink">{c.name}</span>
                <span className="text-sm text-ink-faint">{c.relationship}</span>
              </div>
              <div className="mt-3">
                <ContactActions contact={c} context={{ zoneLabel, signalLabels }} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 rounded-2xl border border-line bg-surface px-5 py-4 text-sm text-ink-muted">
          No one in your circle is set to be reached at this zone yet. Your
          crisis line is always right here.
        </p>
      )}

      {/* Quick access to the crisis line — prominent in red, gentle in amber. */}
      <div className="mt-5 rounded-2xl border border-line bg-surface px-5 py-4">
        <p className="text-sm text-ink-faint">
          {zone === "red"
            ? "If you'd rather talk to someone now"
            : "Or, if you'd prefer, your crisis line is here too"}
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <span className="text-ink">
            <span className="font-medium">{crisisLineName}</span>
            <span className="text-ink-faint"> · {crisisLinePhone}</span>
          </span>
          <a
            href={telHref(crisisLinePhone)}
            className={`inline-flex min-h-[2.75rem] items-center justify-center rounded-pill px-5 py-2.5 text-sm font-medium ${
              zone === "red"
                ? "bg-crisis-500 text-white hover:bg-crisis-600"
                : "border border-crisis-300 text-crisis-700 hover:bg-crisis-50"
            }`}
          >
            Call now
          </a>
        </div>
      </div>
    </Card>
  );
}
