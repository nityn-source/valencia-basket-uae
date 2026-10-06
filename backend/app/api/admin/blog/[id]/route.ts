import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/adminAuth";
import { storage } from "@/lib/storage";
import { blogPostInputSchema, blogQuickEditSchema, normalizeBlogPostInput, formatBlogValidationError } from "@/lib/blog";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

function withoutPasswordHash(post: any) {
  const { passwordHash, ...safePost } = post;
  return safePost;
}

async function preparePost(input: any, existing: any) {
  const normalized = normalizeBlogPostInput(input);
  const { password, ...normalizedPost } = normalized;
  const post: typeof normalizedPost & { passwordHash?: string | null } = normalizedPost;
  if (post.visibility === "password") {
    if (password) post.passwordHash = await bcrypt.hash(password, 10);
    else if (!existing.passwordHash) throw new Error("A password is required for password-protected posts");
  } else {
    post.passwordHash = null;
  }
  return post;
}

function parseId(value: string) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  const id = parseId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid blog post id" }, { status: 400 });

  try {
    const existing = await storage.getBlogPostById(id);
    if (!existing) return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    const parsed = blogPostInputSchema.parse(await request.json());
    const updated = await storage.updateBlogPost(id, await preparePost(parsed, existing));
    revalidatePath("/blog");
    revalidatePath("/blog/author/[slug]", "page");
    revalidatePath("/sitemap.xml");
    revalidatePath(`/blog/${existing.slug}`);
    if (updated.status !== "draft") revalidatePath(`/blog/${updated.slug}`);
    return NextResponse.json(withoutPasswordHash(updated));
  } catch (error: any) {
    if (error?.name === "ZodError" || error?.message?.includes("Featured image") || error?.message?.includes("password-protected")) {
      return NextResponse.json({ error: formatBlogValidationError(error), details: error.errors }, { status: 400 });
    }
    if (error?.code === "23505" || error?.code === "BLOG_TAXONOMY_CONFLICT") {
      if (error?.code === "BLOG_TAXONOMY_CONFLICT") {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      return NextResponse.json({ error: "That slug, category, or tag already exists" }, { status: 409 });
    }
    console.error("[blog] failed to update post:", error);
    return NextResponse.json({ error: "Failed to update blog post" }, { status: 500 });
  }
}

/** Quick edit from the article list: change the author and/or categories without reopening the article. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  const id = parseId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid blog post id" }, { status: 400 });

  try {
    const existing = await storage.getBlogPostById(id);
    if (!existing) return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    const { authorName, categoryNames } = blogQuickEditSchema.parse(await request.json());
    const updated = await storage.updateBlogPost(id, {
      ...(authorName !== undefined ? { authorName } : {}),
      // Categories and tags are saved together, so the article's tags are passed back unchanged.
      ...(categoryNames !== undefined
        ? { categoryNames: [...new Set(categoryNames)], tagNames: existing.tags.map((tag) => tag.name) }
        : {}),
      lockModifiedDate: existing.lockModifiedDate,
    });
    revalidatePath("/blog");
    revalidatePath("/blog/author/[slug]", "page");
    revalidatePath(`/blog/${updated.slug}`);
    return NextResponse.json(withoutPasswordHash(updated));
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: formatBlogValidationError(error) }, { status: 400 });
    }
    if (error?.code === "BLOG_TAXONOMY_CONFLICT" || error?.code === "23505") {
      return NextResponse.json({ error: error.message ?? "That category already exists" }, { status: 409 });
    }
    console.error("[blog] failed to quick-edit post:", error);
    return NextResponse.json({ error: "Failed to update blog post" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  const id = parseId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid blog post id" }, { status: 400 });

  try {
    const existing = await storage.getBlogPostById(id);
    if (!existing) return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    await storage.deleteBlogPost(id);
    revalidatePath("/blog");
    revalidatePath("/blog/author/[slug]", "page");
    revalidatePath("/sitemap.xml");
    revalidatePath(`/blog/${existing.slug}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[blog] failed to delete post:", error);
    return NextResponse.json({ error: "Failed to delete blog post" }, { status: 500 });
  }
}