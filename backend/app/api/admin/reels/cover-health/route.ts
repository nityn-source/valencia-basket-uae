import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { storage } from "@/lib/storage";
import { probeCoverHealth } from "@/lib/content/reelCoverHealth";

export const dynamic = "force-dynamic";

/**
 * Whether automatic reel covers are working. ?probe=1 also re-checks Instagram
 * when the last check is over a day old; ?probe=force re-checks right now.
 */
export async function GET(request: NextRequest) {
  const error = await requireAdmin(request);
  if (error) return error;
  const probe = request.nextUrl.searchParams.get("probe");
  const reels = probe ? await storage.getReelItems() : [];
  const sample = reels.find((reel) => reel.visible && !/REPLACE_ME/.test(reel.url)) ?? null;
  return NextResponse.json(await probeCoverHealth(probe ? sample?.url ?? null : null, probe === "force"));
}
