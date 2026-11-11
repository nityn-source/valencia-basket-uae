import type { MetadataRoute } from "next";
import { storage } from "@/lib/storage";
import { getSeoOverrides } from "@/lib/seo/resolve";
import { authorPath } from "@/lib/content/staff";
import { getBlogAuthors } from "@/lib/content/staffStore";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://valenciabasket.ae";

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/programs`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/programs/future-ballers`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/programs/mini-basket`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/programs/youth-academy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/programs/girls-basketball`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/programs/private-training`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/methodology`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/coaches`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/facilities`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/admissions`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/faqs`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  const [events, blogPosts] = await Promise.all([
    storage.getAllEvents(),
    storage.getPublishedBlogPosts(),
  ]);

  const eventPages: MetadataRoute.Sitemap = events.map((event) => ({
    url: `${baseUrl}/events/${event.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const blogPages: MetadataRoute.Sitemap = blogPosts
    .filter((post) => !post.noIndex)
    .map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  const authorPages: MetadataRoute.Sitemap = (await getBlogAuthors()).map((author) => ({
    url: `${baseUrl}${authorPath(author.slug)}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  // A page an admin has marked noindex should not be advertised in the sitemap.
  const overrides = await getSeoOverrides();
  const noIndexPaths = new Set(
    [...overrides.values()].filter((row) => row.noIndex).map((row) => row.path)
  );

  return [...staticPages, ...eventPages, ...blogPages, ...authorPages].filter((entry) => {
    const path = entry.url.slice(baseUrl.length) || "/";
    return !noIndexPaths.has(path);
  });
}
