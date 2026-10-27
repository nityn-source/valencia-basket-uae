import { useQuery } from "@tanstack/react-query";

/** Mirrors lib/content/reelCoverHealth.ts (kept separate so the admin bundle doesn't import server code). */
export interface CoverHealth {
  state: "unknown" | "ok" | "failing";
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  failingSince: string | null;
  reason: string | null;
  message: string | null;
  failures: number;
}

export const COVER_HEALTH_KEY = ["admin-reel-cover-health"];

/** Whether automatic reel covers are working; also re-checks Instagram if the last check is over a day old. */
export function useCoverHealth() {
  return useQuery<CoverHealth>({
    queryKey: COVER_HEALTH_KEY,
    queryFn: async () => {
      const res = await fetch("/api/admin/reels/cover-health?probe=1");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
