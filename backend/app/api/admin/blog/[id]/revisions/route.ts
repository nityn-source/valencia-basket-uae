import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { storage } from "@/lib/storage";
import { revisionFields, sameRevisionFields } from "@/lib/blogRevisions";

export const dynamic = "force-dynamic";

/** The saved versions of an article, newest first (without their text). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ error: "Invalid blog post id" }, { status: 400 });
  try {
    const post = await storage.getBlogPostById(id);
    if (!post) return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    const revisions = await storage.listBlogRevisions(id);
    // The newest version is "current" when it matches the article as it is now.
    const newest = revisions[0] ? await storage.getBlogRevision(id, revisions[0].id) : undefined;
    const currentRevisionId = newest && sameRevisionFields(revisionFields(newest), revisionFields(post)) ? newest.id : null;
    return NextResponse.json({ revisions, currentRevisionId });
  } catch (error) {
    console.error("[blog] failed to list revisions:", error);
    return NextResponse.json({ error: "Version history isn't available right now" }, { status: 500 });
  }
}
