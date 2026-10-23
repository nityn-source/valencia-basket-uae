import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { storage } from "@/lib/storage";
import { reelInputSchema, REEL_TARGET_IDS } from "@/lib/reels";
import { rowToReel } from "@/lib/content/reelsStore";
import { revalidateReelPages } from "@/lib/content/reelsRevalidate";

export const dynamic = "force-dynamic";

const targetOrder = (target: string) => (REEL_TARGET_IDS as readonly string[]).indexOf(target);

export async function GET(request: NextRequest) {
  const error = await requireAdmin(request);
  if (error) return error;
  const rows = await storage.getReelItems();
  const reels = rows.map(rowToReel).sort((a, b) => targetOrder(a.target) - targetOrder(b.target) || (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || (a.id ?? 0) - (b.id ?? 0));
  return NextResponse.json({ reels });
}

export async function POST(request: NextRequest) {
  const error = await requireAdmin(request);
  if (error) return error;
  const parsed = reelInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: issue?.message ?? "Invalid reel", field: issue?.path[0] ?? null }, { status: 400 });
  }
  const existing = await storage.getReelItems();
  const lastInTarget = Math.max(-1, ...existing.filter((row) => row.target === parsed.data.target).map((row) => row.sortOrder));
  const { poster, ...fields } = parsed.data;
  const created = await storage.createReelItem({ ...fields, poster: poster || null, sortOrder: lastInTarget + 1 });
  revalidateReelPages();
  return NextResponse.json(rowToReel(created), { status: 201 });
}
