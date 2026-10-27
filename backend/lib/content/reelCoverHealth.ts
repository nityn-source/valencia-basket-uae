import "server-only";
import { storage } from "@/lib/storage";
import { FAILURE_TEXT, NOT_A_HEALTH_SIGNAL, fetchReelCover, type CoverFailure, type CoverResult } from "@/lib/reelCover";

/**
 * Whether automatic reel covers are working, kept so the admin can warn when
 * they stop. Stored as one row in the page-content table (no extra migration).
 */
export interface CoverHealth {
  state: "unknown" | "ok" | "failing";
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  failingSince: string | null;
  reason: CoverFailure | null;
  message: string | null;
  failures: number;
}

const KEY = "system.reel-cover-health";
/** The admin re-checks Instagram at most this often on its own. */
export const PROBE_EVERY_MS = 24 * 60 * 60 * 1000;

export const EMPTY_HEALTH: CoverHealth = { state: "unknown", lastAttemptAt: null, lastSuccessAt: null, failingSince: null, reason: null, message: null, failures: 0 };

/** The health after one more attempt. Failures that aren't about Instagram's access (a private reel) change nothing. */
export function nextHealth(previous: CoverHealth, result: CoverResult, now: Date): CoverHealth {
  const at = now.toISOString();
  if (result.ok) return { state: "ok", lastAttemptAt: at, lastSuccessAt: at, failingSince: null, reason: null, message: null, failures: 0 };
  if (NOT_A_HEALTH_SIGNAL.includes(result.reason)) return previous;
  return {
    ...previous,
    state: "failing",
    lastAttemptAt: at,
    failingSince: previous.state === "failing" ? previous.failingSince ?? at : at,
    reason: result.reason,
    message: `${FAILURE_TEXT[result.reason]} (${result.detail})`,
    failures: previous.state === "failing" ? previous.failures + 1 : 1,
  };
}

export async function readCoverHealth(): Promise<CoverHealth> {
  try {
    const row = (await storage.getAllPageContentOverrides()).find((candidate) => candidate.key === KEY);
    return row ? { ...EMPTY_HEALTH, ...(JSON.parse(row.value) as Partial<CoverHealth>) } : EMPTY_HEALTH;
  } catch {
    return EMPTY_HEALTH;
  }
}

/** Records the outcome of an attempt; returns the new health. Never throws. */
export async function recordCoverResult(result: CoverResult): Promise<CoverHealth> {
  const previous = await readCoverHealth();
  const next = nextHealth(previous, result, new Date());
  if (next !== previous) {
    try {
      await storage.upsertPageContentOverride(KEY, JSON.stringify(next));
    } catch (error) {
      console.error("[reel-covers] couldn't save health:", error);
    }
  }
  return next;
}

/** A cover for a reel, with the outcome recorded for the admin warning. */
export async function coverForReel(reelUrl: string): Promise<CoverResult> {
  const result = await fetchReelCover(reelUrl);
  await recordCoverResult(result);
  return result;
}

/**
 * Asks Instagram whether it still shows a cover picture for a reel, saving
 * nothing. Skipped unless `force`, or it is due (never checked, or the last
 * check was over a day ago).
 */
export async function probeCoverHealth(reelUrl: string | null, force = false): Promise<CoverHealth> {
  const current = await readCoverHealth();
  if (!reelUrl) return current;
  const due = !current.lastAttemptAt || Date.now() - new Date(current.lastAttemptAt).getTime() > PROBE_EVERY_MS;
  if (!force && !due) return current;
  return recordCoverResult(await fetchReelCover(reelUrl, { probeOnly: true }));
}
