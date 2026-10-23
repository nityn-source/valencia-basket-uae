import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/adminAuth";
import { storage } from "@/lib/storage";
import { REEL_TARGET_IDS } from "@/lib/reels";
import { revalidateReelPages } from "@/lib/content/reelsRevalidate";

export const dynamic = "force-dynamic";

const body = z.object({
  target: z.enum(REEL_TARGET_IDS),
  ids: z.array(z.number().int().positive()).min(1).max(200),
});

/** Saves the new order of one place's reels (the full list of its reel ids, top to bottom). */
export async function PUT(request: NextRequest) {
  const error = await requireAdmin(request);
  if (error) return error;
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid order" }, { status: 400 });

  const inTarget = (await storage.getReelItems()).filter((row) => row.target === parsed.data.target).map((row) => row.id);
  const same = inTarget.length === parsed.data.ids.length && inTarget.every((id) => parsed.data.ids.includes(id));
  if (!same) return NextResponse.json({ error: "The list changed; reload and try again" }, { status: 409 });

  await storage.reorderReelItems(parsed.data.target, parsed.data.ids);
  revalidateReelPages();
  return NextResponse.json({ success: true });
}
