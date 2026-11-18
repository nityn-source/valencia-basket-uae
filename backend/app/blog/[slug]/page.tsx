import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { storage } from "@/lib/storage";
import { blogPlainText } from "@/lib/blog";
import { blogAccessCookieName, isLiveBlogPost, verifyBlogAccessToken } from "@/lib/blogAccess";
import { authorDisplayName } from "@/lib/content/staff";
import { getAuthorForPost } from "@/lib/content/staffStore";
import { BlogArticle } from "@/components/blog/BlogArticle";
import { PasswordForm } from "./PasswordForm";

export const dynamic = "force-dynamic";

const blogPostPath = (slug: string) => `/blog/${slug}`;

async function getPost(slug: string) {
  return storage.getBlogPostBySlug(slug, true);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = await getPost((await params).slug);
  if (!post || post.visibility === "private" || !isLiveBlogPost(post)) return { title: "Article Not Found | Valencia Basket Academy UAE" };
  if (post.visibility === "password") {
    return {
      title: `${post.title} | Valencia Basket Academy UAE`,
      description: "This article is password protected.",
      alternates: { canonical: blogPostPath(post.slug) },
      openGraph: { title: post.title, url: blogPostPath(post.slug) },
      robots: { index: false, follow: false },
    };
  }
  const description = post.metaDescription || post.excerpt || blogPlainText(post.content).slice(0, 160);
  return {
    title: post.metaTitle || `${post.title} | Valencia Basket Academy UAE`,
    description,
    // Each article is its own canonical page. Without this it inherits the site-wide "/" from the layout.
    alternates: { canonical: blogPostPath(post.slug) },
    robots: post.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: post.ogTitle || post.metaTitle || post.title,
      description: post.ogDescription || description,
      url: blogPostPath(post.slug),
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      authors: [await getAuthorForPost(post.authorName).then((author) => (author ? authorDisplayName(author) : post.authorName))],
      images: post.ogImage || post.featuredImageSrc ? [{ url: post.ogImage || post.featuredImageSrc! }] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const post = await getPost((await params).slug);
  if (!post || post.visibility === "private" || !isLiveBlogPost(post)) notFound();
  if (post.visibility === "password") {
    const secret = process.env.SESSION_SECRET;
    const token = (await cookies()).get(blogAccessCookieName(post.id))?.value;
    if (!secret || !verifyBlogAccessToken(token, post.id, secret)) {
      return (
        <section className="bg-gray-50 py-20 md:py-28">
          <div className="container mx-auto px-4 md:px-6">
            <PasswordForm slug={post.slug} />
          </div>
        </section>
      );
    }
  }
  return <BlogArticle post={post} />;
}