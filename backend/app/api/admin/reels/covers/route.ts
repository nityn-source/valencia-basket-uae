import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { storage } from "@/lib/storage";
import { coverForReel, readCoverHealth } from "@/lib/content/reelCoverHealth";
import { revalidateReelPages } from "@/lib/content/reelsRevalidate";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Most reels filled in per click, so a slow Instagram can't hang the request. */
const BATCH = 6;

/** Takes Instagram's cover picture for every reel that has none. */
export async function POST(request: NextRequest) {
  const error = await requireAdmin(request);
  if (error) return error;
  const missing = (await storage.getReelItems()).filter((reel) => !reel.poster && !/REPLACE_ME/.test(reel.url));
  let added = 0;
  let failed = 0;
  for (const reel of missing.slice(0, BATCH)) {
    const result = await coverForReel(reel.url);
    if (result.ok) {
      await storage.updateReelItem(reel.id, { poster: result.url });
      added++;
    } else {
      failed++;
      if (result.reason === "blocked" || result.reason === "login_wall") break; // Instagram is turning us away; stop asking.
    }
    await new Promise((resolve) => setTimeout(resolve, 600));
  }
  if (added) revalidateReelPages();
  return NextResponse.json({ added, failed, remaining: Math.max(0, missing.length - added), health: await readCoverHealth() });
}
