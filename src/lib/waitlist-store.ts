import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Dead-simple durable store for waitlist sign-ups.
 *
 *  - On Vercel: if a KV (Upstash Redis) store is connected, entries are pushed
 *    to a Redis list over the REST API (durable, retrievable from anywhere).
 *    Set up with one click — "Storage → Create → KV" auto-injects
 *    KV_REST_API_URL and KV_REST_API_TOKEN.
 *  - Otherwise (e.g. local dev): entries are appended to a JSONL file under
 *    ./.data (or /tmp if that's read-only). Functional and retrievable locally.
 *
 * No SDK dependency — just fetch + fs.
 */

export interface WaitlistEntry {
  email: string;
  role: string;
  note: string;
  createdAt: string;
  source: string;
}

const REDIS_KEY = "anchor:waitlist";

function kv(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  return url && token ? { url, token } : null;
}

async function kvCmd(
  c: { url: string; token: string },
  cmd: (string | number)[],
): Promise<{ result: unknown }> {
  const res = await fetch(c.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${c.token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(cmd),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`KV request failed: ${res.status}`);
  return res.json();
}

async function filePath(): Promise<string> {
  if (process.env.WAITLIST_FILE) return process.env.WAITLIST_FILE;
  const dir = path.join(process.cwd(), ".data");
  try {
    await fs.mkdir(dir, { recursive: true });
    return path.join(dir, "waitlist.jsonl");
  } catch {
    // Read-only filesystem (serverless) — fall back to the writable temp dir.
    return path.join("/tmp", "anchor-waitlist.jsonl");
  }
}

const parse = (s: string): WaitlistEntry | null => {
  try {
    return JSON.parse(s) as WaitlistEntry;
  } catch {
    return null;
  }
};

/** Which backend is in use — surfaced in the admin view for clarity. */
export function storeMode(): "kv" | "file" {
  return kv() ? "kv" : "file";
}

export async function addEntry(entry: WaitlistEntry): Promise<void> {
  const c = kv();
  if (c) {
    await kvCmd(c, ["RPUSH", REDIS_KEY, JSON.stringify(entry)]);
    return;
  }
  const fp = await filePath();
  await fs.appendFile(fp, `${JSON.stringify(entry)}\n`, "utf8");
}

export async function listEntries(): Promise<WaitlistEntry[]> {
  const c = kv();
  if (c) {
    const { result } = await kvCmd(c, ["LRANGE", REDIS_KEY, 0, -1]);
    const arr = Array.isArray(result) ? (result as string[]) : [];
    return arr.map(parse).filter((e): e is WaitlistEntry => e !== null);
  }
  const fp = await filePath();
  try {
    const txt = await fs.readFile(fp, "utf8");
    return txt
      .split("\n")
      .filter(Boolean)
      .map(parse)
      .filter((e): e is WaitlistEntry => e !== null);
  } catch {
    return [];
  }
}
