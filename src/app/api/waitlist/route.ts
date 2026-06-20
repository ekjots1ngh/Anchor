import { NextResponse } from "next/server";

/**
 * POST /api/waitlist — capture interest from the public landing page.
 *
 * Provider-agnostic so it's deploy-ready with zero setup:
 *   - It ALWAYS logs the submission (a "WAITLIST" line in the server / Vercel
 *     function logs), so nothing is lost even with nothing configured.
 *   - If WAITLIST_WEBHOOK_URL is set, it also forwards the submission there —
 *     point it at a Google Sheet (Apps Script), Airtable, Formspree, a Slack/
 *     Discord webhook, Zapier/Make, etc. to collect entries durably.
 *
 * The email is used only to forward to that sink; it is never exposed client-side.
 */

export const runtime = "nodejs";

const validEmail = (e: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const b = (body ?? {}) as Record<string, unknown>;

  // Honeypot: real people leave this empty. Silently accept + drop bots.
  if (typeof b.company === "string" && b.company.trim()) {
    return NextResponse.json({ ok: true });
  }

  const email = typeof b.email === "string" ? b.email.trim() : "";
  if (!validEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }

  const entry = {
    email: email.slice(0, 200),
    role: typeof b.role === "string" ? b.role.slice(0, 120) : "",
    note: typeof b.note === "string" ? b.note.slice(0, 1000) : "",
    createdAt: new Date().toISOString(),
    source: "landing",
  };

  // Fallback sink: always captured in the function logs.
  console.log("WAITLIST", JSON.stringify(entry));

  const sink = process.env.WAITLIST_WEBHOOK_URL;
  if (sink) {
    try {
      await fetch(sink, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      // Don't block the person — we've already logged it.
      console.error(
        "WAITLIST_WEBHOOK_FAILED",
        error instanceof Error ? error.message : "unknown error",
      );
    }
  }

  return NextResponse.json({ ok: true });
}
