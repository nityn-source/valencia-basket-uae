import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/adminAuth";
import { storage } from "@/lib/storage";
import { videoInputSchema } from "@/lib/videoTestimonials";
import { rowToVideoTestimonial } from "@/lib/content/videoTestimonialsStore";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const error = await requireAdmin(request);
  if (error) return error;
  const rows = await storage.getVideoTestimonials();
  return NextResponse.json({ videos: rows.map(rowToVideoTestimonial) });
}

export async function POST(request: NextRequest) {
  const error = await requireAdmin(request);
  if (error) return error;
  const parsed = videoInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: issue?.message ?? "Invalid video", field: issue?.path[0] ?? null }, { status: 400 });
  }
  const existing = await storage.getVideoTestimonials();
  const { poster, ...fields } = parsed.data;
  const created = await storage.createVideoTestimonial({
    ...fields,
    poster: poster || null,
    sortOrder: Math.max(-1, ...existing.map((row) => row.sortOrder)) + 1,
  });
  revalidatePath("/");
  return NextResponse.json(rowToVideoTestimonial(created), { status: 201 });
}
