#!/usr/bin/env node
// Print waitlist sign-ups from the durable store.
//   npm run waitlist            (table)
//   npm run waitlist -- --json  (raw JSON)
// Uses Vercel KV if KV_REST_API_URL/KV_REST_API_TOKEN are set, else the local
// ./.data/waitlist.jsonl file.
import { promises as fs } from "node:fs";
import path from "node:path";

const REDIS_KEY = "anchor:waitlist";

async function load() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (url && token) {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(["LRANGE", REDIS_KEY, 0, -1]),
    });
    if (!res.ok) throw new Error(`KV request failed: ${res.status}`);
    const { result } = await res.json();
    return (result || []).map(safeParse).filter(Boolean);
  }
  const fp = process.env.WAITLIST_FILE || path.join(process.cwd(), ".data", "waitlist.jsonl");
  try {
    const txt = await fs.readFile(fp, "utf8");
    return txt.split("\n").filter(Boolean).map(safeParse).filter(Boolean);
  } catch {
    return [];
  }
}

const safeParse = (s) => { try { return JSON.parse(s); } catch { return null; } };

const entries = await load();
if (process.argv.includes("--json")) {
  console.log(JSON.stringify(entries, null, 2));
} else {
  console.log(`\n${entries.length} sign-up(s)\n`);
  for (const e of entries) {
    console.log(`  ${new Date(e.createdAt).toLocaleString()}  ${e.email}  [${e.role || "—"}]`);
    if (e.note) console.log(`      "${e.note}"`);
  }
  console.log("");
}
