import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { buildPageMetadata } from "@/lib/seo/resolve";
import { BreadcrumbJsonLd } from "@/components/seo/StructuredData";
import { storage } from "@/lib/storage";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { getContent } from "@/lib/content/pageContent";
import { matchAuthor } from "@/lib/content/staff";
import { getBlogAuthors } from "@/lib/content/staffStore";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("/blog");
}

export default async function BlogPage() {
  const posts = await storage.getPublishedBlogPosts().catch((error) => {
    console.error("[blog] failed to load public posts:", error);
    return [];
  });
  const heroSubtext = await getContent("blog.hero.subtext");
  const authors = await getBlogAuthors().catch(() => []);

  return (
    <>
      <BreadcrumbJsonLd path="/blog" label="Blog" />
      <section className="bg-black text-white py-20 md:py-28 relative overflow-hidden">
        <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-4xl">
            <span className="inline-flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-sm mb-5">
              <BookOpen className="h-4 w-4" />
              From the Academy
            </span>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.95] mb-7">
              The Valencia Basket UAE Blog
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-2xl leading-relaxed">
              {heroSubtext}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          {posts.length === 0 ? (
            <div className="mx-auto max-w-3xl border-l-4 border-primary bg-gray-50 p-8 md:p-12">
              <p className="mb-3 text-sm font-bold uppercase tracking-widest text-primary">No published articles</p>
              <h2 className="mb-5 text-3xl font-black uppercase tracking-tight">Stories from the court are on the way</h2>
              <p className="max-w-2xl text-lg leading-relaxed text-gray-600">
                Approved articles will appear here once they are published by the academy team.
              </p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <BlogPostCard key={post.id} post={post} author={matchAuthor(authors, post.authorName)} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}