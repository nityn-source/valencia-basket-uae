import "server-only";
import { cache } from "react";
import { storage } from "@/lib/storage";
import {
  structuredDataRegistry,
  breadcrumbStructuredDataRegistry,
  breadcrumbs,
  contactStructuredData,
  buildFaqStructuredData,
  SITE,
  ORGANIZATION_ID,
  WEBSITE_ID,
  authorSchema,
} from "./structuredData";
import { getCoachStructuredEntries } from "./coaches";
import { AUTHOR_SLUGS, authorDisplayName, authorPath, matchAuthor, type StaffMember } from "@/lib/content/staff";
import { getAuthorBySlug, getBlogAuthors } from "@/lib/content/staffStore";
import { getVisibleFaqs } from "@/lib/content/faqStore";
import { getContent } from "@/lib/content/pageContent";
import { getPageDefaults } from "./registry";
import { getSeoOverrides, mergeSeo } from "./resolve";

export const getStructuredDataOverrides = cache(async () => {
  try {
    return new Map((await storage.getAllSeoSchemaOverrides()).map((row) => [row.path, row]));
  } catch (error) {
    console.error("[seo] failed to load structured data overrides:", error);
    return new Map();
  }
});

/** Pure computation of an Event's Schema.org JSON-LD — no DB reads, no overrides. */
export function getEventStructuredData(event: {
  id: string;
  slug: string;
  title: string;
  date: string;
  description: string;
  location: string;
  endDate: string | null;
}): Record<string, unknown>[] {
  const path = `/events/${event.slug}`;
  const startDate = /^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(event.date) ? { startDate: event.date } : {};
  const endDate =
    event.endDate && /^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(event.endDate) ? { endDate: event.endDate } : {};
  return [
    {
      "@context": "https://schema.org",
      "@type": "Event",
      name: event.title,
      url: `https://valenciabasket.ae${path}`,
      description: event.description,
      ...startDate,
      ...endDate,
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: { "@type": "Place", name: event.location },
    },
  ];
}

/**
 * Pages whose schema is generated from live data and must stay that way: a
 * saved manual override would freeze the list and silently stop new content
 * from appearing, so overrides are ignored (only the on/off toggle applies).
 */
export const AUTO_SCHEMA_PATHS = new Set(["/blog", ...AUTHOR_SLUGS.map(authorPath)]);

/**
 * Blog home page schema: the page itself (CollectionPage), the Blog it lists,
 * and the breadcrumb, linked by @id. The post list is read from the database
 * on every render, so a newly published article appears here with no edit.
 */
async function blogListingSchema(): Promise<Record<string, unknown>[]> {
  const posts = (await storage.getPublishedBlogPosts()).filter(
    (post) => post.visibility === "public" && !post.noIndex && post.schemaEnabled,
  );
  const authors = await getBlogAuthors();
  // Calendar date as the academy sees it (Dubai time), so a late-evening post keeps its date.
  const dubaiDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dubai", year: "numeric", month: "2-digit", day: "2-digit" });
  const day = (value: Date | string | null) => (value ? dubaiDay.format(new Date(value)) : undefined);
  // Legacy posts may hold base64 data URIs; never inline those into schema.
  const imageUrl = (src: string | null) =>
    src?.startsWith("https://") ? src : src?.startsWith("/") ? `${SITE}${src}` : undefined;
  const defaults = getPageDefaults("/blog");
  const seo = defaults ? mergeSeo(defaults, (await getSeoOverrides()).get("/blog")) : undefined;
  const url = `${SITE}/blog`;
  const publisher = { "@type": "Organization", "@id": ORGANIZATION_ID };
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${url}#webpage`,
      url,
      name: seo?.title ?? "Basketball Academy Blog | Valencia Basket UAE",
      description: seo?.description,
      isPartOf: { "@type": "WebSite", "@id": WEBSITE_ID },
      about: publisher,
      mainEntity: { "@type": "Blog", "@id": `${url}#blog` },
      inLanguage: "en-AE",
    },
    {
      "@context": "https://schema.org",
      "@type": "Blog",
      "@id": `${url}#blog`,
      name: "The Valencia Basket UAE Blog",
      description: await getContent("blog.hero.subtext"),
      url,
      publisher,
      inLanguage: "en-AE",
      blogPost: posts.map((post) => ({
        "@type": "BlogPosting",
        "@id": `${SITE}/blog/${post.slug}#article`,
        headline: post.title,
        url: `${SITE}/blog/${post.slug}`,
        datePublished: day(post.publishedAt),
        dateModified: day(post.updatedAt) ?? day(post.publishedAt),
        image: imageUrl(post.featuredImageSrc),
        author: authorSchema(post.authorName, matchAuthor(authors, post.authorName)),
        publisher,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "Blog", item: url },
      ],
    },
  ];
}

/** Profile page for a blog author: their Person entity plus their public articles. */
async function authorPageSchema(author: StaffMember): Promise<Record<string, unknown>[]> {
  const url = `${SITE}${authorPath(author.slug)}`;
  const person = authorSchema(authorDisplayName(author), author);
  const posts = (await storage.getPublishedBlogPosts()).filter(
    (post) => post.visibility === "public" && !post.noIndex && post.schemaEnabled && matchAuthor([author], post.authorName),
  );
  return [
    {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      "@id": url,
      url,
      name: `${authorDisplayName(author)} — ${author.role}`,
      mainEntity: person,
      hasPart: posts.map((post) => ({
        "@type": "BlogPosting",
        headline: post.title,
        url: `${SITE}/blog/${post.slug}`,
        datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
        author: { "@id": `${url}#person` },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
        { "@type": "ListItem", position: 3, name: authorDisplayName(author), item: url },
      ],
    },
  ];
}

/**
 * The full default JSON-LD array for a page, before any admin override is
 * applied. Combines the static registry, the page's breadcrumb, and any
 * live-content schema (events, coaches, FAQs, contact) that belongs on it.
 */
async function computeDefaultPageSchema(path: string, label?: string): Promise<Record<string, unknown>[]> {
  if (path === "/__schema/sitewide-organization") {
    const entry = structuredDataRegistry.find((candidate) => candidate.key === "/__schema/sitewide-organization");
    return entry ? [entry.json as Record<string, unknown>] : [];
  }

  const eventSlugMatch = /^\/events\/([^/]+)$/.exec(path);
  if (eventSlugMatch) {
    const event = await storage.getEventBySlug(eventSlugMatch[1]);
    if (!event) return [];
    return [...getEventStructuredData(event), breadcrumbs(path, event.title) as Record<string, unknown>];
  }

  const staticEntries = structuredDataRegistry
    .filter((entry) => entry.path === path && entry.key !== "/__schema/sitewide-organization")
    .map((entry) => entry.json as Record<string, unknown>);
  const breadcrumbEntry = breadcrumbStructuredDataRegistry.find((entry) => entry.path === path);
  const breadcrumbJson = breadcrumbEntry
    ? (breadcrumbEntry.json as Record<string, unknown>)
    : label && path !== "/"
      ? (breadcrumbs(path, label) as Record<string, unknown>)
      : null;
  const withBreadcrumb = (entries: Record<string, unknown>[]) =>
    breadcrumbJson ? [...entries, breadcrumbJson] : entries;

  if (path === "/coaches") {
    const coaches = (await getCoachStructuredEntries(true)).map((entry) => entry.json as Record<string, unknown>);
    return withBreadcrumb([...staticEntries, ...coaches]);
  }
  if (path === "/faqs") {
    return withBreadcrumb([...staticEntries, buildFaqStructuredData(await getVisibleFaqs()) as unknown as Record<string, unknown>]);
  }
  if (path === "/contact") {
    return withBreadcrumb([...staticEntries, contactStructuredData as unknown as Record<string, unknown>]);
  }
  if (path === "/blog") {
    return [...staticEntries, ...(await blogListingSchema())];
  }
  const authorSlugMatch = /^\/blog\/author\/([^/]+)$/.exec(path);
  if (authorSlugMatch) {
    const author = await getAuthorBySlug(authorSlugMatch[1]);
    return author ? authorPageSchema(author) : [];
  }
  if (path === "/events") {
    const events = await storage.getAllEvents();
    const eventSchemas = events.flatMap((event) => getEventStructuredData(event));
    return withBreadcrumb([...staticEntries, ...eventSchemas]);
  }

  return withBreadcrumb(staticEntries);
}

/**
 * Single entry point pages use to render their JSON-LD. An admin-saved
 * override, when present, fully replaces the computed default for that page.
 */
export async function getStructuredData(path: string, label?: string): Promise<Record<string, unknown>[]> {
  const overrides = await getStructuredDataOverrides();
  const saved = overrides.get(path);
  if (saved) {
    if (!saved.enabled) return [];
    if (Array.isArray(saved.overrides) && !AUTO_SCHEMA_PATHS.has(path)) {
      return saved.overrides as Record<string, unknown>[];
    }
  }
  return computeDefaultPageSchema(path, label);
}

export async function getSitewideStructuredData(): Promise<Record<string, unknown>[]> {
  return getStructuredData("/__schema/sitewide-organization");
}
