import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/adminAuth";
import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";

const body = z.object({ ids: z.array(z.number().int().positive()).min(1).max(200) });

/** Saves the new order (the full list of video ids, top to bottom). */
export async function PUT(request: NextRequest) {
  const error = await requireAdmin(request);
  if (error) return error;
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid order" }, { status: 400 });

  const current = (await storage.getVideoTestimonials()).map((row) => row.id);
  const same = current.length === parsed.data.ids.length && current.every((id) => parsed.data.ids.includes(id));
  if (!same) return NextResponse.json({ error: "The list changed; reload and try again" }, { status: 409 });

  await storage.reorderVideoTestimonials(parsed.data.ids);
  revalidatePath("/");
  return NextResponse.json({ success: true });
}
