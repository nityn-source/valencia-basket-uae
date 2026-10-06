import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BreadcrumbJsonLd } from "@/components/seo/StructuredData";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { buildPageMetadata, getAltResolver } from "@/lib/seo/resolve";
import { storage } from "@/lib/storage";
import { authorDisplayName, authorPath, matchAuthor } from "@/lib/content/staff";
import { getAuthorBySlug, staffPhotoAlt, staffSocialLinks } from "@/lib/content/staffStore";
import { SocialIcons } from "@/components/SocialIcons";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const author = await getAuthorBySlug((await params).slug);
  if (!author) return { title: "Author Not Found | Valencia Basket Academy UAE" };
  return buildPageMetadata(authorPath(author.slug));
}

export default async function BlogAuthorPage({ params }: { params: Promise<{ slug: string }> }) {
  const author = await getAuthorBySlug((await params).slug);
  if (!author) notFound();

  const [allPosts, alt] = await Promise.all([
    storage.getPublishedBlogPosts().catch((error) => {
      console.error("[blog] failed to load author posts:", error);
      return [];
    }),
    getAltResolver(),
  ]);
  const posts = allPosts.filter((post) => matchAuthor([author], post.authorName));
  const bio = author.authorBio?.trim() || author.bio;
  const socials = staffSocialLinks(author);
  const name = authorDisplayName(author);
  const paragraphs = bio.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
  const firstName = name.split(" ")[0];

  return (
    <>
      <BreadcrumbJsonLd path={authorPath(author.slug)} label={name} />
      <section className="bg-black py-16 text-white md:py-24">
        <div className="container mx-auto max-w-5xl px-4 md:px-6">
          <Link href="/blog" className="mb-10 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:gap-12">
            <div className="relative aspect-[3/4] w-48 shrink-0 overflow-hidden bg-gray-800 md:w-64">
              {author.image && <Image src={author.image} alt={staffPhotoAlt(author, alt)} fill sizes="(max-width: 768px) 192px, 256px" className="object-cover object-top" priority />}
            </div>
            <div>
              <span className="mb-4 block text-sm font-bold uppercase tracking-widest text-primary">Author</span>
              <h1 className="mb-3 text-4xl font-black uppercase leading-none tracking-tighter md:text-6xl">{author.name}</h1>
              <p className="mb-6 text-sm font-bold uppercase tracking-widest text-primary">{author.role}</p>
              <SocialIcons links={socials} personName={name} tone="dark" className="mb-6" />
              <div className="max-w-2xl space-y-4 text-lg leading-relaxed text-gray-300">
                {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="mb-10 text-3xl font-black uppercase tracking-tighter md:text-4xl">Articles by {name}</h2>
          {posts.length === 0 ? (
            <div className="max-w-3xl border-l-4 border-primary bg-gray-50 p-8">
              <p className="text-lg leading-relaxed text-gray-600">
                {firstName}&apos;s first article is on the way. In the meantime, <Link href="/blog" className="font-bold text-primary hover:underline">browse the blog</Link>.
              </p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => <BlogPostCard key={post.id} post={post} author={author} />)}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
