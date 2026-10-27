import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/adminAuth";
import { storage } from "@/lib/storage";
import { videoInputSchema } from "@/lib/videoTestimonials";
import { rowToVideoTestimonial } from "@/lib/content/videoTestimonialsStore";

export const dynamic = "force-dynamic";

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const error = await requireAdmin(request);
  if (error) return error;
  const id = parseId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid video id" }, { status: 400 });
  if (!(await storage.getVideoTestimonialById(id))) return NextResponse.json({ error: "Video not found" }, { status: 404 });

  const parsed = videoInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: issue?.message ?? "Invalid video", field: issue?.path[0] ?? null }, { status: 400 });
  }
  const { poster, ...fields } = parsed.data;
  const updated = await storage.updateVideoTestimonial(id, { ...fields, poster: poster || null });
  revalidatePath("/");
  return NextResponse.json(rowToVideoTestimonial(updated!));
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const error = await requireAdmin(request);
  if (error) return error;
  const id = parseId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid video id" }, { status: 400 });
  if (!(await storage.getVideoTestimonialById(id))) return NextResponse.json({ error: "Video not found" }, { status: 404 });
  await storage.deleteVideoTestimonial(id);
  revalidatePath("/");
  return NextResponse.json({ success: true });
}
