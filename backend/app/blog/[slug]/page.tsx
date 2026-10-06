import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { ArrowLeft, CalendarDays, UserRound } from "lucide-react";
import { BreadcrumbJsonLd, StructuredData } from "@/components/seo/StructuredData";
import { blogPostStructuredData } from "@/lib/seo/structuredData";
import { storage } from "@/lib/storage";
import { blogPlainText, sanitizeBlogContent } from "@/lib/blog";
import { blogAccessCookieName, isLiveBlogPost, verifyBlogAccessToken } from "@/lib/blogAccess";
import { authorDisplayName, authorPath } from "@/lib/content/staff";
import { getAuthorForPost, staffPhotoAlt } from "@/lib/content/staffStore";
import { getAltResolver } from "@/lib/seo/resolve";
import { PasswordForm } from "./PasswordForm";

export const dynamic = "force-dynamic";

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
      robots: { index: false, follow: false },
    };
  }
  const description = post.metaDescription || post.excerpt || blogPlainText(post.content).slice(0, 160);
  return {
    title: post.metaTitle || `${post.title} | Valencia Basket Academy UAE`,
    description,
    robots: post.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: post.ogTitle || post.metaTitle || post.title,
      description: post.ogDescription || description,
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
  const author = await getAuthorForPost(post.authorName);
  const authorName = author ? authorDisplayName(author) : post.authorName;
  const alt = await getAltResolver();
  const safeContent = sanitizeBlogContent(post.content);
  const hasRichContent = /<[a-z][\s\S]*>/i.test(safeContent);

  const articleJson = post.schemaEnabled
    ? blogPostStructuredData({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || blogPlainText(post.content).slice(0, 160),
        authorName: post.authorName,
        featuredImageSrc: post.featuredImageSrc,
        publishedAt: post.publishedAt,
        updatedAt: post.updatedAt,
      }, author)
    : null;

  return (
    <>
      <BreadcrumbJsonLd path={`/blog/${post.slug}`} label={post.title} />
      {articleJson && <StructuredData data={[articleJson]} />}
      <article>
        <header className="bg-black py-20 text-white md:py-28">
          <div className="container mx-auto max-w-4xl px-4 md:px-6">
            <Link href="/blog" className="mb-6 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-primary">
              <ArrowLeft className="h-4 w-4" /> Back to Blog
            </Link>
            <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-bold uppercase tracking-widest text-primary">
              {post.publishedAt && (
                <span className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  {new Date(post.publishedAt).toLocaleDateString("en-AE", { year: "numeric", month: "long", day: "numeric" })}
                </span>
              )}
              <span className="flex items-center gap-2 text-gray-400" data-testid="article-author">
                <UserRound className="h-4 w-4" />
                By{" "}
                {author ? <Link href={authorPath(author.slug)} className="text-white underline-offset-4 hover:text-primary hover:underline">{authorName}</Link> : post.authorName}
              </span>
            </div>
            <h1 className="text-4xl font-black uppercase leading-tight tracking-tight md:text-6xl">{post.title}</h1>
            {post.excerpt && <p className="mt-6 max-w-3xl text-xl leading-relaxed text-gray-400">{post.excerpt}</p>}
          </div>
        </header>
        <div className="container mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-20">
          {hasRichContent ? (
            <div className="prose blog-content max-w-none text-lg leading-8 text-gray-700" dangerouslySetInnerHTML={{ __html: safeContent }} />
          ) : (
            <div className="whitespace-pre-line text-lg leading-8 text-gray-700">{safeContent}</div>
          )}
          {author && (
            <aside className="mt-16 flex flex-col gap-6 border-t border-gray-200 pt-10 sm:flex-row sm:items-start" data-testid="author-box">
              <Link href={authorPath(author.slug)} className="relative block aspect-square w-24 shrink-0 overflow-hidden bg-gray-100">
                {author.image && <Image src={author.image} alt={staffPhotoAlt(author, alt)} fill sizes="96px" className="object-cover object-top" />}
              </Link>
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">Written by</p>
                <p className="text-2xl font-black uppercase leading-tight">
                  <Link href={authorPath(author.slug)} className="hover:text-primary">{authorName}</Link>
                </p>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">{author.role}</p>
                <p className="leading-relaxed text-gray-600">{author.bio}</p>
                <Link href={authorPath(author.slug)} className="mt-3 inline-block text-sm font-bold uppercase tracking-wider text-primary hover:underline">
                  More from {authorName.split(" ")[0]} →
                </Link>
              </div>
            </aside>
          )}
        </div>
      </article>
    </>
  );
}