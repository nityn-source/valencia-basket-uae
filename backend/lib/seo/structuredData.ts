/**
 * Structured data emitted by the site. These objects are the single source of
 * truth: the pages render them as JSON-LD and the admin SEO Manager reads them
 * back for its read-only "Structured data" view. There is no free-form schema
 * editor by design.
 */

import { DEFAULT_FAQS, faqAnswerPlainText, type FaqItem } from "@/lib/content/faq";
import { authorDisplayName, authorPath, type StaffMember } from "@/lib/content/staff";

export const CONTACT_MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=AllSports+Arena+Al+Quoz+Dubai";

export const contactStructuredData = {
  "@context": "https://schema.org",
  "@type": "SportsActivityLocation",
  name: "Valencia Basket Academy UAE",
  url: "https://valenciabasket.ae/contact",
  telephone: "+971544386838",
  email: "info@valenciabasket.ae",
  address: {
    "@type": "PostalAddress",
    streetAddress:
      "Hadaeq Mohammed Bin Rashid, AllSports Arena, Latifa Bint Hamdan St, Al Quoz Ind. First",
    addressLocality: "Dubai",
    addressCountry: "AE",
  },
  hasMap: CONTACT_MAPS_URL,
  sameAs: [
    "https://www.instagram.com/valenciabasketuae",
    "https://www.tiktok.com/@valenciabasketuae",
  ],
} as const;

/** FAQPage schema for the questions currently shown on /faqs. */
export function buildFaqStructuredData(items: Pick<FaqItem, "question" | "answer">[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: faqAnswerPlainText(item.answer) },
    })),
  };
}

export const faqStructuredData = buildFaqStructuredData(DEFAULT_FAQS);

export interface StructuredDataEntry {
  key?: string;
  path: string;
  label: string;
  type: string;
  /** Where the JSON-LD comes from, shown in the admin as context. */
  note: string;
  json: unknown;
  enabled?: boolean;
}

export type EditableSchemaField = { key: string; label: string; type: "text" | "url" | "email" | "date"; required?: boolean };
export interface ManagedStructuredDataEntry extends StructuredDataEntry {
  key: string;
  fields: EditableSchemaField[];
  lockedFields?: string[];
  enabledByDefault: boolean;
}

export const SITE = "https://valenciabasket.ae";
/** The academy logo at its original address on the site (absolute, as schema.org needs). */
export const LOGO_URL = `${SITE}/images/logo.png`;
export const ORGANIZATION_ID = `${SITE}/#organization`;
export const WEBSITE_ID = `${SITE}/#website`;
const organization = {
  "@context": "https://schema.org", "@type": "SportsOrganization", "@id": ORGANIZATION_ID,
  name: "Valencia Basket Academy UAE", url: SITE, telephone: "+971544386838",
  email: "info@valenciabasket.ae",
  logo: LOGO_URL,
  address: { "@type": "PostalAddress", streetAddress: "Hadaeq Mohammed Bin Rashid, AllSports Arena, Latifa Bint Hamdan St, Al Quoz Ind. First", addressLocality: "Dubai", addressCountry: "AE" },
  sameAs: ["https://www.instagram.com/valenciabasketuae", "https://www.tiktok.com/@valenciabasketuae", "https://www.facebook.com/profile.php?id=61587608243652", "https://www.linkedin.com/company/valencia-basket-academy-uae/"],
};
const page = (path: string, name: string, type = "WebPage") => ({
  "@context": "https://schema.org", "@type": type, name, url: `${SITE}${path}`,
});
export const structuredDataRegistry: ManagedStructuredDataEntry[] = [
  { key: "/__schema/sitewide-organization", path: "/", label: "Academy organization", type: "SportsOrganization", note: "Sitewide academy identity.", json: organization, enabledByDefault: true, fields: [{ key: "telephone", label: "Telephone", type: "text", required: true }, { key: "email", label: "Email", type: "email", required: true }], lockedFields: ["name", "url", "logo", "address", "sameAs"] },
  { key: "/__schema/home-website", path: "/", label: "Website", type: "WebSite", note: "Home page website identity.", json: { "@context": "https://schema.org", "@type": "WebSite", "@id": WEBSITE_ID, name: "Valencia Basket Academy UAE", url: SITE }, enabledByDefault: true, fields: [], lockedFields: ["name", "url"] },
  { key: "future-ballers", path: "/programs/future-ballers", label: "Future Ballers", type: "Course", note: "Core program details.", json: { ...page("/programs/future-ballers", "Future Ballers", "Course"), description: "Basketball development program for ages 4 to 6." }, enabledByDefault: true, fields: [{ key: "description", label: "Description", type: "text", required: true }], lockedFields: ["name", "url"] },
  { key: "mini-basket", path: "/programs/mini-basket", label: "Mini Basket", type: "Course", note: "Core program details.", json: { ...page("/programs/mini-basket", "Mini Basket", "Course"), description: "Basketball development program for ages 7 to 10." }, enabledByDefault: true, fields: [{ key: "description", label: "Description", type: "text", required: true }], lockedFields: ["name", "url"] },
  { key: "youth-academy", path: "/programs/youth-academy", label: "Youth Academy", type: "Course", note: "Core program details.", json: { ...page("/programs/youth-academy", "Youth Academy", "Course"), description: "Basketball development program for ages 11 to 18." }, enabledByDefault: true, fields: [{ key: "description", label: "Description", type: "text", required: true }], lockedFields: ["name", "url"] },
  { key: "facilities", path: "/facilities", label: "Facilities", type: "SportsActivityLocation", note: "Academy's venue page.", json: { ...page("/facilities", "AllSports Arena", "SportsActivityLocation"), hasMap: CONTACT_MAPS_URL }, enabledByDefault: true, fields: [{ key: "hasMap", label: "Map URL", type: "url" }], lockedFields: ["name", "url"] },
  { key: "admissions", path: "/admissions", label: "Admissions", type: "WebPage", note: "Admissions page.", json: page("/admissions", "Admissions"), enabledByDefault: true, fields: [], lockedFields: ["name", "url"] },
];
export const breadcrumbPages = [
  ["/programs", "Programs"], ["/programs/future-ballers", "Future Ballers"],
  ["/programs/mini-basket", "Mini Basket"], ["/programs/youth-academy", "Youth Academy"],
  ["/programs/private-training", "Private Training"], ["/methodology", "Methodology"],
  ["/coaches", "Coaches"], ["/facilities", "Facilities"], ["/admissions", "Admissions"],
  ["/events", "Events"], ["/contact", "Contact"], ["/faqs", "FAQs"], ["/blog", "Blog"],
  ["/privacy-policy", "Privacy Policy"], ["/terms", "Terms and Conditions"],
] as const;
export const breadcrumbStructuredDataRegistry: ManagedStructuredDataEntry[] = breadcrumbPages.map(([path, label]) => ({
  key: `/__schema/breadcrumb${path}`, path, label: `${label} breadcrumb`, type: "BreadcrumbList",
  note: "Derived from the route and page label.", json: breadcrumbs(path, label), enabledByDefault: true,
  fields: [], lockedFields: ["all route and label values"],
}));

/**
 * One shared BlogPosting template applied to every published blog post.
 * Fully derived from the post's own fields — no per-post admin editing,
 * by design. Toggle per post via blog_posts.schema_enabled.
 */
/**
 * Person schema for a blog author. A staff author (resolved by the caller)
 * gets a stable @id, url, title, photo and social profiles so search engines
 * tie their articles together; anyone else stays a plain named Person.
 */
export function authorSchema(authorName: string, author?: StaffMember) {
  if (!author) return { "@type": "Person", name: authorName };
  const url = `${SITE}${authorPath(author.slug)}`;
  const sameAs = [author.instagram, author.facebook, author.tiktok].filter((link): link is string => !!link);
  return {
    "@type": "Person",
    "@id": `${url}#person`,
    name: authorDisplayName(author),
    url,
    jobTitle: author.role,
    image: author.image?.startsWith("/") ? `${SITE}${author.image}` : author.image || undefined,
    worksFor: { "@type": "Organization", name: "Valencia Basket Academy UAE", url: SITE },
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function blogPostStructuredData(post: {
  title: string;
  slug: string;
  excerpt: string | null;
  authorName: string;
  featuredImageSrc: string | null;
  publishedAt: Date | string | null;
  updatedAt: Date | string | null;
}, author?: StaffMember) {
  const url = `${SITE}/blog/${post.slug}`;
  const iso = (value: Date | string | null) =>
    value ? new Date(value).toISOString() : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.featuredImageSrc ?? undefined,
    author: authorSchema(post.authorName, author),
    publisher: {
      "@type": "Organization",
      name: "Valencia Basket Academy UAE",
      logo: { "@type": "ImageObject", url: LOGO_URL },
    },
    datePublished: iso(post.publishedAt),
    dateModified: iso(post.updatedAt) ?? iso(post.publishedAt),
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
  };
}

export function breadcrumbs(path: string, label: string) {
  const crumbs = path.split("/").filter(Boolean);
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: SITE }, ...crumbs.map((part, index) => ({ "@type": "ListItem", position: index + 2, name: index === crumbs.length - 1 ? label : part.replace(/-/g, " "), item: `${SITE}/${crumbs.slice(0, index + 1).join("/")}` }))] };
}
