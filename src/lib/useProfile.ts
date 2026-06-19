"use client";

import { useEffect, useState } from "react";
import type { Profile } from "@/lib/types";
import { loadProfile } from "@/lib/store";

/**
 * Small client hook to read the saved profile after hydration. Returns
 * `loading: true` until localStorage has been read, then the profile (or
 * null if the person hasn't onboarded yet).
 */
export function useProfile(): { profile: Profile | null; loading: boolean } {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setProfile(loadProfile());
    setLoading(false);
  }, []);

  return { profile, loading };
}
