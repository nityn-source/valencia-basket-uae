import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { Eye } from "lucide-react";
import { BlogArticle } from "@/components/blog/BlogArticle";
import { previewStatusText, revisionBannerText } from "@/lib/blogPreview";
import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Article preview",
  robots: { index: false, follow: false },
};

async function isSignedInAdmin() {
  const token = (await cookies()).get("admin_token")?.value;
  if (!token) return false;
  const session = await storage.getSessionByToken(token);
  return !!session && new Date(session.expiresAt) > new Date();
}

/**
 * Admin-only preview of a blog article exactly as visitors will see it, for any
 * status (draft, scheduled, published, password) and the saved version only.
 * Needs the admin sign-in cookie; anyone else sees a plain sign-in message.
 */
export default async function BlogPreviewPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ revision?: string }> }) {
  if (!(await isSignedInAdmin())) {
    return (
      <section className="container mx-auto max-w-xl px-4 py-32 text-center">
        <h1 className="text-2xl font-black uppercase">Sign in to preview</h1>
        <p className="mt-3 text-gray-600">Previews are for signed-in admins. Sign in to the admin dashboard, then open the preview again.</p>
        <Link href="/admin" className="mt-6 inline-block bg-black px-5 py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-primary">Go to admin</Link>
      </section>
    );
  }

  const { id } = await params;
  const postId = /^\d+$/.test(id) ? Number(id) : NaN;
  const post = Number.isSafeInteger(postId) ? await storage.getBlogPostById(postId) : undefined;
  if (!post) notFound();
  const { passwordHash: _passwordHash, ...livePost } = post;

  // ?revision=<id> previews an earlier saved version: its title, text, image and SEO fields on the current article.
  const revisionParam = (await searchParams).revision;
  const revisionId = revisionParam && /^\d+$/.test(revisionParam) ? Number(revisionParam) : NaN;
  const revision = Number.isSafeInteger(revisionId) ? await storage.getBlogRevision(postId, revisionId) : undefined;
  if (revisionParam && !revision) notFound();
  const safePost = revision
    ? { ...livePost, title: revision.title, excerpt: revision.excerpt, content: revision.content, featuredImageSrc: revision.featuredImageSrc, featuredImageAlt: revision.featuredImageAlt, metaTitle: revision.metaTitle, metaDescription: revision.metaDescription }
    : livePost;

  return (
    <>
      <div className="sticky top-[56px] z-40 border-b border-black bg-yellow-300 text-black" data-testid="blog-preview-banner">
        <div className="container mx-auto flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-sm md:px-6">
          <span className="flex items-center gap-2 font-black uppercase tracking-wider"><Eye className="h-4 w-4" /> Preview</span>
          <span>{revision ? revisionBannerText(revision) : previewStatusText(post)}</span>
          {!revision && <span className="text-black/70">Shows the last saved version.</span>}
        </div>
      </div>
      <BlogArticle post={safePost} preview />
    </>
  );
}
