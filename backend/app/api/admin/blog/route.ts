import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminUsername, requireAdmin } from "@/lib/adminAuth";
import { storage } from "@/lib/storage";
import { blogPostInputSchema, normalizeBlogPostInput, formatBlogValidationError } from "@/lib/blog";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

function withoutPasswordHash(post: any) {
  const { passwordHash, ...safePost } = post;
  return safePost;
}

async function preparePost(input: any, existing?: any) {
  const normalized = normalizeBlogPostInput(input);
  const { password, ...normalizedPost } = normalized;
  const post: typeof normalizedPost & { passwordHash?: string | null } = normalizedPost;
  if (post.visibility === "password") {
    if (password) post.passwordHash = await bcrypt.hash(password, 10);
    else if (!existing?.passwordHash) throw new Error("A password is required for password-protected posts");
  } else {
    post.passwordHash = null;
  }
  return post;
}

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  try {
    return NextResponse.json((await storage.getAllBlogPosts()).map(withoutPasswordHash));
  } catch (error) {
    console.error("[blog] failed to list posts:", error);
    return NextResponse.json({ error: "Failed to load blog posts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  try {
    const parsed = blogPostInputSchema.parse(await request.json());
    const post = await storage.createBlogPost(await preparePost(parsed), { savedBy: await getAdminUsername(request) });
    revalidatePath("/blog");
    revalidatePath("/blog/author/[slug]", "page");
    revalidatePath("/sitemap.xml");
    if (post.status !== "draft") revalidatePath(`/blog/${post.slug}`);
    return NextResponse.json(withoutPasswordHash(post), { status: 201 });
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
    console.error("[blog] failed to create post:", error);
    return NextResponse.json({ error: "Failed to create blog post" }, { status: 500 });
  }
}