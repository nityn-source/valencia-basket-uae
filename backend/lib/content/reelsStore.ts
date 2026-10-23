import "server-only";
import { storage } from "@/lib/storage";
import type { ReelItemRow } from "@shared/schema";
import { REEL_TARGET_IDS, type Reel, type ReelTarget } from "@/lib/reels";
import { SAMPLE_REELS } from "@/data/reels";

export function rowToReel(row: ReelItemRow): Reel {
  return {
    id: row.id,
    url: row.url,
    caption: row.caption,
    target: (REEL_TARGET_IDS as readonly string[]).includes(row.target) ? (row.target as ReelTarget) : "homepage",
    poster: row.poster,
    sortOrder: row.sortOrder,
    visible: row.visible,
  };
}

/**
 * Visible reels for one place on the site, in the order set in the admin. If
 * the database has no reels at all, a local/dev site shows the sample layout
 * reels; production shows nothing. A database error also shows nothing.
 */
export async function getReels(target: ReelTarget): Promise<Reel[]> {
  try {
    const rows = await storage.getReelItems();
    if (rows.length === 0) {
      return process.env.NODE_ENV === "production" ? [] : SAMPLE_REELS.filter((reel) => reel.target === target);
    }
    return rows.filter((row) => row.visible && row.target === target).map(rowToReel);
  } catch (error) {
    console.error("[reels] failed to load reels:", error);
    return [];
  }
}
