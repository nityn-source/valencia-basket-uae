import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarDays, UserRound } from "lucide-react";
import { BreadcrumbJsonLd, StructuredData } from "@/components/seo/StructuredData";
import { blogPostStructuredData } from "@/lib/seo/structuredData";
import type { SafeBlogPost } from "@/lib/storage";
import { blogPlainText, sanitizeBlogContent, withoutBlankParagraphs } from "@/lib/blog";
import { buildArticleToc } from "@/lib/blogToc";
import { BlogToc } from "@/components/blog/BlogToc";
import { authorDisplayName, authorPath } from "@/lib/content/staff";
import { getAuthorForPost, staffPhotoAlt } from "@/lib/content/staffStore";
import { getAltResolver } from "@/lib/seo/resolve";
import { InstagramEmbedSizer } from "@/components/blog/InstagramEmbedSizer";

/**
 * The article page body, shared by the public page (/blog/<slug>) and the admin
 * preview, so a preview is exactly what visitors will see. A preview leaves out
 * the search-engine data (breadcrumbs and article schema).
 */
export async function BlogArticle({ post, preview = false }: { post: SafeBlogPost; preview?: boolean }) {
  const author = await getAuthorForPost(post.authorName);
  const authorName = author ? authorDisplayName(author) : post.authorName;
  const alt = await getAltResolver();
  const safeContent = withoutBlankParagraphs(sanitizeBlogContent(post.content));
  const hasRichContent = /<[a-z][\s\S]*>/i.test(safeContent);
  // Contents box: needs at least 3 H2 headings; it goes just before the first one.
  const toc = hasRichContent ? buildArticleToc(safeContent) : null;
  const articleClass = "prose blog-content max-w-none text-lg leading-8 text-gray-700";

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
      {!preview && <BreadcrumbJsonLd path={`/blog/${post.slug}`} label={post.title} />}
      {!preview && articleJson && <StructuredData data={[articleJson]} />}
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
            <h1 className="page-title text-4xl font-black uppercase leading-tight tracking-tight md:text-6xl">{post.title}</h1>
            {post.excerpt && <p className="mt-6 max-w-3xl text-xl leading-relaxed text-gray-400">{post.excerpt}</p>}
          </div>
        </header>
        <div className="container mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-20">
          {hasRichContent ? (
            <>
              {toc?.enabled ? (
                <>
                  {toc.insertAt > 0 && <div className={articleClass} dangerouslySetInnerHTML={{ __html: toc.html.slice(0, toc.insertAt) }} />}
                  <BlogToc items={toc.items} />
                  <div className={articleClass} dangerouslySetInnerHTML={{ __html: toc.html.slice(toc.insertAt) }} />
                </>
              ) : (
                <div className={articleClass} dangerouslySetInnerHTML={{ __html: safeContent }} />
              )}
              <InstagramEmbedSizer />
            </>
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