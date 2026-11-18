import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { storage } from "@/lib/storage";
import { diffArticles, diffWords } from "@/lib/blogDiff";
import { blogWordCount } from "@/lib/blogRevisions";

export const dynamic = "force-dynamic";

/** One saved version, compared with the article as it is now. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; revisionId: string }> }) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  const { id: idText, revisionId: revisionText } = await params;
  const id = Number(idText);
  const revisionId = Number(revisionText);
  if (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(revisionId) || revisionId <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  try {
    const [post, revision] = await Promise.all([storage.getBlogPostById(id), storage.getBlogRevision(id, revisionId)]);
    if (!post || !revision) return NextResponse.json({ error: "Version not found" }, { status: 404 });
    return NextResponse.json({
      revision: {
        id: revision.id,
        createdAt: revision.createdAt,
        savedBy: revision.savedBy,
        reason: revision.reason,
        wordCount: revision.wordCount,
        title: revision.title,
        restoredFromId: revision.restoredFromId,
      },
      current: { title: post.title, wordCount: blogWordCount(post.content) },
      diff: {
        title: diffWords(post.title, revision.title),
        excerpt: diffWords(post.excerpt ?? "", revision.excerpt ?? ""),
        metaTitle: diffWords(post.metaTitle ?? "", revision.metaTitle ?? ""),
        metaDescription: diffWords(post.metaDescription ?? "", revision.metaDescription ?? ""),
        featuredImageChanged: (post.featuredImageSrc ?? "") !== (revision.featuredImageSrc ?? "") || (post.featuredImageAlt ?? "") !== (revision.featuredImageAlt ?? ""),
        article: diffArticles(post.content, revision.content),
      },
    });
  } catch (error) {
    console.error("[blog] failed to load revision:", error);
    return NextResponse.json({ error: "Couldn't load that version" }, { status: 500 });
  }
}
