"use client";

import { useEffect, useState } from "react";
import type { Profile } from "@/lib/types";
import { loadProfile, PROFILE_CHANGED_EVENT } from "@/lib/store";

/**
 * Small client hook to read the saved profile after hydration. Returns
 * `loading: true` until localStorage has been read, then the profile (or
 * null if the person hasn't onboarded yet).
 *
 * Re-reads whenever the store changes (PROFILE_CHANGED_EVENT) — so a check-in,
 * or the demo panel tipping the data, updates the dashboard live with no reload.
 */
export function useProfile(): { profile: Profile | null; loading: boolean } {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const reload = () => {
      setProfile(loadProfile());
      setLoading(false);
    };
    reload();
    window.addEventListener(PROFILE_CHANGED_EVENT, reload);
    return () => window.removeEventListener(PROFILE_CHANGED_EVENT, reload);
  }, []);

  return { profile, loading };
}
