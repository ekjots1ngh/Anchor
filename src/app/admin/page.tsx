import { listEntries, storeMode, type WaitlistEntry } from "@/lib/waitlist-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Tiny protected admin view of waitlist sign-ups.
 * Open  /admin?key=YOUR_ADMIN_TOKEN  (set ADMIN_TOKEN in the env).
 */
export default async function AdminPage({
  searchParams,
}: {
  searchParams: { key?: string };
}) {
  const token = process.env.ADMIN_TOKEN;

  if (!token) {
    return (
      <Shell>
        <Note>
          Admin isn&rsquo;t configured. Set an <code>ADMIN_TOKEN</code>{" "}
          environment variable, then open <code>/admin?key=…</code>.
        </Note>
      </Shell>
    );
  }

  if (searchParams.key !== token) {
    return (
      <Shell>
        <Note>
          Add your access key to the URL: <code>/admin?key=YOUR_ADMIN_TOKEN</code>.
        </Note>
      </Shell>
    );
  }

  let entries: WaitlistEntry[] = [];
  let error: string | null = null;
  try {
    entries = (await listEntries()).reverse(); // newest first
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to read the store.";
  }

  return (
    <Shell>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Waitlist sign-ups</h1>
        <span className="text-sm text-ink-faint">
          {entries.length} {entries.length === 1 ? "entry" : "entries"} · store:{" "}
          {storeMode() === "kv" ? "Vercel KV (durable)" : "local file"}
        </span>
      </div>

      {error ? (
        <Note>Couldn&rsquo;t read the store: {error}</Note>
      ) : entries.length === 0 ? (
        <Note>No sign-ups yet.</Note>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-card border border-line bg-surface shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-ink-faint">
              <tr>
                <Th>When</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Note</Th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={i} className="border-b border-line/60 last:border-0 align-top">
                  <Td className="whitespace-nowrap text-ink-faint">
                    {new Date(e.createdAt).toLocaleString()}
                  </Td>
                  <Td className="font-medium text-ink">{e.email}</Td>
                  <Td className="text-ink-muted">{e.role || "(none)"}</Td>
                  <Td className="text-ink-muted">{e.note || "(none)"}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 text-xs leading-relaxed text-ink-faint">
        For durable retrieval on Vercel, connect a KV store (Storage → Create →
        KV). Without it, sign-ups go to a local file (fine for dev) and the
        server logs.
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <main className="mx-auto max-w-content px-5 py-12 sm:px-6 sm:py-16">{children}</main>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-line bg-surface p-5 leading-relaxed text-ink-muted">
      {children}
    </p>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-medium">{children}</th>;
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
