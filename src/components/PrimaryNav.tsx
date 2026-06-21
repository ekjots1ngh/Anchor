"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/checkin", label: "Check-in" },
  { href: "/dashboard", label: "Home" },
  { href: "/journal", label: "Journal" },
  { href: "/plan", label: "My plan" },
  { href: "/data", label: "Your data" },
];

/**
 * The lightweight primary nav. It marks the current page with aria-current so
 * screen-reader and sighted users always know where they are, and keeps tap
 * targets comfortably large for tired or unsteady hands.
 */
export function PrimaryNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="flex flex-wrap gap-1 text-sm sm:text-base">
      {NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex min-h-[2.75rem] items-center rounded-pill px-4 py-2 ${
              active
                ? "bg-accent-soft font-medium text-accent-text"
                : "text-ink-muted hover:bg-accent-soft hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
