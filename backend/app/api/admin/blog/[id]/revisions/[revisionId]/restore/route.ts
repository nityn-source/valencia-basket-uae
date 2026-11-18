import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminUsername, requireAdmin } from "@/lib/adminAuth";
import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";

/** Puts an earlier version's title, excerpt, text, image and SEO fields back. The current version stays in the history. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; revisionId: string }> }) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  const { id: idText, revisionId: revisionText } = await params;
  const id = Number(idText);
  const revisionId = Number(revisionText);
  if (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(revisionId) || revisionId <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  try {
    const existing = await storage.getBlogPostById(id);
    if (!existing) return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    const restored = await storage.restoreBlogRevision(id, revisionId, await getAdminUsername(request));
    if (!restored) return NextResponse.json({ error: "Version not found" }, { status: 404 });
    revalidatePath("/blog");
    revalidatePath("/blog/author/[slug]", "page");
    revalidatePath("/sitemap.xml");
    revalidatePath(`/blog/${restored.slug}`);
    const { passwordHash: _passwordHash, ...safePost } = restored;
    return NextResponse.json(safePost);
  } catch (error) {
    console.error("[blog] failed to restore version:", error);
    return NextResponse.json({ error: "Couldn't restore that version" }, { status: 500 });
  }
}
