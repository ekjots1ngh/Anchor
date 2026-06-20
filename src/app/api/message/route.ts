import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

/**
 * POST /api/message  — the ONLY place an LLM touches Anchor's output.
 *
 * Architecture boundary (see README → Design principle 2):
 *   - The ZONE has already been decided by the transparent rules engine
 *     (src/lib/zone.ts). This route does NOT decide anything. It is handed the
 *     engine's result — which signals drifted, and by how much — plus the
 *     person's own staying-well actions, and its only job is to phrase a warm,
 *     non-alarming message.
 *   - The Anthropic API key is read from the ANTHROPIC_API_KEY environment
 *     variable and used only here, on the server. It is never sent to or
 *     exposed in the browser.
 *   - If no key is configured, this route returns 503 and the dashboard falls
 *     back to its deterministic, template-based copy — so the app still works.
 */

export const runtime = "nodejs";

type Zone = "amber" | "red";

interface Driver {
  label: string;
  drift: number; // 0..1
}

interface MessageRequest {
  zone: Zone;
  zoneLabel?: string; // the person's own word for this zone
  drivers: Driver[]; // signals that have drifted, most to least
  stayingWellActions: string[]; // what has helped this person before
  firstName?: string;
}

const SYSTEM_PROMPT = `You write a single short, warm note for someone using Anchor, a calm staying-well companion app. They manage their mental health and have, while well, chosen a few personal early-warning signs for the app to gently mirror back to them.

A transparent, non-AI rules engine has ALREADY decided that a few of those signs have drifted a little from this person's own baseline. You are NOT deciding anything and you are NOT assessing them. Your only job is to phrase the note warmly.

NEVER:
- Never diagnose, or imply any diagnosis or condition.
- Never predict, warn of, or imply that an episode, relapse, or crisis is coming, likely, or possible.
- Never give medical advice, or any instruction about medication, treatment, or clinical care.
- Never catastrophise or use urgent, fearful, or clinical language. No words like "relapse", "episode", "symptom", "psychosis", "warning", "risk", "concern".

ALWAYS:
- Reassure plainly that some drift from baseline is normal and does NOT mean anything is wrong or that an episode is coming.
- Gently name what has drifted, in everyday words, using the signals you are given.
- If staying-well actions are provided, point the person back to one or two of those things that have helped them before.
- Warmly encourage reaching out to a real person they trust, such as a friend, family member, or someone on their care team.

STYLE:
- 2 to 4 short sentences. Second person ("you"). Calm, kind, grounded, human.
- Do NOT use em-dashes (—) or en-dashes (–) anywhere in the note. Use commas, full stops, colons, or parentheses instead.
- Output ONLY the note text. No preamble, no quotation marks, no markdown, no sign-off.`;

function magnitude(drift: number): string {
  if (drift >= 0.66) return "a lot";
  if (drift >= 0.34) return "somewhat";
  return "a little";
}

function buildUserPrompt(req: MessageRequest): string {
  const drifted = [...req.drivers]
    .filter((d) => d.drift > 0)
    .sort((a, b) => b.drift - a.drift)
    .map((d) => `- ${d.label} (drifted ${magnitude(d.drift)})`)
    .join("\n");

  const helps = req.stayingWellActions.length
    ? req.stayingWellActions.map((a) => `- ${a}`).join("\n")
    : "(none recorded)";

  const zonePhrase = req.zoneLabel
    ? `${req.zone}, which the person calls "${req.zoneLabel}"`
    : req.zone;

  return [
    req.firstName ? `The person's name: ${req.firstName}` : "",
    `Zone: ${zonePhrase}`,
    `Signs that have drifted from their baseline lately:\n${drifted || "- (a few signs)"}`,
    `Things that have helped this person stay steady before:\n${helps}`,
    "Write the note now.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function isValid(body: unknown): body is MessageRequest {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    (b.zone === "amber" || b.zone === "red") &&
    Array.isArray(b.drivers) &&
    Array.isArray(b.stayingWellActions)
  );
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // No key configured — the dashboard will use its deterministic copy.
    return NextResponse.json(
      { error: "messaging is not configured" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  if (!isValid(body)) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(body) }],
    });

    const message = response.content
      .filter((block) => block.type === "text")
      .map((block) => (block as { text: string }).text)
      .join("")
      .trim();

    if (!message) {
      return NextResponse.json({ error: "empty response" }, { status: 502 });
    }

    return NextResponse.json({ message });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json(
      { error: "failed to generate message", detail },
      { status: 502 },
    );
  }
}
