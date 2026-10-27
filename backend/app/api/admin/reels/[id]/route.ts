import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { storage } from "@/lib/storage";
import { reelInputSchema } from "@/lib/reels";
import { rowToReel } from "@/lib/content/reelsStore";
import { revalidateReelPages } from "@/lib/content/reelsRevalidate";
import { coverForReel } from "@/lib/content/reelCoverHealth";

export const dynamic = "force-dynamic";

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const error = await requireAdmin(request);
  if (error) return error;
  const id = parseId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid reel id" }, { status: 400 });
  const existing = await storage.getReelItemById(id);
  if (!existing) return NextResponse.json({ error: "Reel not found" }, { status: 404 });

  const parsed = reelInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: issue?.message ?? "Invalid reel", field: issue?.path[0] ?? null }, { status: 400 });
  }

  let sortOrder = existing.sortOrder;
  if (parsed.data.target !== existing.target) {
    const others = (await storage.getReelItems()).filter((row) => row.target === parsed.data.target);
    sortOrder = Math.max(-1, ...others.map((row) => row.sortOrder)) + 1;
  }
  const { poster, ...fields } = parsed.data;
  const auto = poster ? null : await coverForReel(fields.url);
  const updated = await storage.updateReelItem(id, { ...fields, poster: poster || (auto?.ok ? auto.url : null), sortOrder });
  revalidateReelPages();
  return NextResponse.json({ ...rowToReel(updated!), coverStatus: auto ? (auto.ok ? "added" : "failed") : "given" });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const error = await requireAdmin(request);
  if (error) return error;
  const id = parseId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid reel id" }, { status: 400 });
  if (!(await storage.getReelItemById(id))) return NextResponse.json({ error: "Reel not found" }, { status: 404 });
  await storage.deleteReelItem(id);
  revalidateReelPages();
  return NextResponse.json({ success: true });
}
