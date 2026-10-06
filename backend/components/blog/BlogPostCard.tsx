import Link from "next/link";
import { CalendarDays, UserRound } from "lucide-react";
import type { BlogPostWithTaxonomy } from "@/lib/storage";
import { blogPlainText } from "@/lib/blog";
import { authorDisplayName, authorPath, type StaffMember } from "@/lib/content/staff";

function postSummary(post: BlogPostWithTaxonomy) {
  if (post.visibility === "password") return "This article is password protected.";
  const content = blogPlainText(post.content);
  return post.excerpt || `${content.slice(0, 180).trim()}${content.length > 180 ? "…" : ""}`;
}

function postDate(post: BlogPostWithTaxonomy) {
  return post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-AE", { year: "numeric", month: "long", day: "numeric" })
    : "Coming soon";
}

/** `author` is the post's matched blog author; without one the byline is the post's plain authorName. */
export function BlogPostCard({ post, author }: { post: BlogPostWithTaxonomy; author?: StaffMember | null }) {
  return (
    <article className="group overflow-hidden border border-gray-200 bg-white" data-testid={`card-blog-post-${post.id}`}>
      {post.featuredImageSrc && (
        <Link href={`/blog/${post.slug}`} tabIndex={-1} aria-hidden="true" className="block overflow-hidden">
          <img src={post.featuredImageSrc} alt={post.featuredImageAlt ?? post.title} className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </Link>
      )}
      <div className="p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
          <CalendarDays className="h-4 w-4" /> {postDate(post)}
          {post.isFeatured && <span className="text-gray-400">• Featured</span>}
        </div>
        <h2 className="mb-3 text-2xl font-black uppercase leading-tight">
          <Link href={`/blog/${post.slug}`} className="transition-colors hover:text-primary">{post.title}</Link>
        </h2>
        {(author || post.authorName) && (
          <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500" data-testid={`card-blog-author-${post.id}`}>
            <UserRound className="h-4 w-4" />
            By{" "}
            {author ? (
              <Link href={authorPath(author.slug)} className="text-black hover:text-primary hover:underline">{authorDisplayName(author)}</Link>
            ) : (
              post.authorName
            )}
          </p>
        )}
        <p className="mb-5 text-gray-600">{postSummary(post)}</p>
        <Link href={`/blog/${post.slug}`} className="font-bold uppercase tracking-wider text-primary hover:underline">Read article →</Link>
      </div>
    </article>
  );
}
