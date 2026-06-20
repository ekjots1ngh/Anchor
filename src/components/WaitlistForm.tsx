"use client";

import { useState } from "react";

const ROLES = [
  "I live with this myself",
  "I support someone (family or friend)",
  "I'm a clinician or care team",
  "I'm a researcher or commissioner",
  "Just interested",
];

const inputCls =
  "w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink placeholder:text-ink-faint focus:outline-none focus-visible:ring-2 focus-visible:ring-steady-300";

type Status = "idle" | "loading" | "done" | "error";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [note, setNote] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [status, setStatus] = useState<Status>("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, role, note, company }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div
        className="rounded-card border border-steady-200 bg-steady-50 p-6 sm:p-8"
        aria-live="polite"
      >
        <h3 className="text-xl font-semibold text-ink">Thank you, you&rsquo;re on the list.</h3>
        <p className="mt-2 leading-relaxed text-ink-muted">
          We&rsquo;ll only be in touch about Anchor, and only now and then. Your
          email stays private, and you can ask us to remove it any time.
        </p>
        <a
          href="/onboarding"
          className="mt-5 inline-flex min-h-[2.75rem] items-center rounded-pill border border-steady-300 px-5 py-2.5 font-medium text-steady-700 hover:bg-steady-50"
        >
          Want to see it? Try the prototype
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {/* Honeypot — hidden from people, tempting to bots. */}
      <div className="sr-only" aria-hidden>
        <label htmlFor="company">Company</label>
        <input
          id="company"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>

      <label className="block">
        <span className="text-sm font-medium text-ink">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={`${inputCls} mt-2`}
          autoComplete="email"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-ink">
          Which is most you? <span className="text-ink-faint">(optional)</span>
        </span>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className={`${inputCls} mt-2`}
        >
          <option value="">Prefer not to say</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-ink">
          Anything you&rsquo;d want this to do for you?{" "}
          <span className="text-ink-faint">(optional)</span>
        </span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="A sentence is plenty."
          className={`${inputCls} mt-2`}
        />
      </label>

      {status === "error" ? (
        <p className="text-sm text-crisis-700" aria-live="polite">
          Something went wrong. Please check your email and try again.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "loading"}
        className="inline-flex min-h-[3rem] w-full items-center justify-center rounded-pill bg-steady-600 px-7 py-3 text-lg font-medium text-white hover:bg-steady-700 disabled:opacity-60 sm:w-auto"
      >
        {status === "loading" ? "Joining…" : "Join the waitlist"}
      </button>

      <p className="text-sm leading-relaxed text-ink-faint">
        We&rsquo;ll only use your email to tell you about Anchor. We won&rsquo;t
        share it, and you can ask us to delete it any time. No spam, promise.
      </p>
    </form>
  );
}
