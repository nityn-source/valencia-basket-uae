import { sql } from "drizzle-orm";
import {
  AnyPgColumn,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const LEAD_STATUS_VALUES = [
  "New",
  "Qualified",
  "Not Qualified",
  "Booked Free Appointment",
  "Didn't show up",
  "Converted Lead",
] as const;

export type LeadStatus = (typeof LEAD_STATUS_VALUES)[number];

export const leadStatusSchema = z.enum(LEAD_STATUS_VALUES);

export const trialBookings = pgTable(
  "trial_bookings",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    parentName: text("parent_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    whatsapp: boolean("whatsapp").notNull().default(false),
    playerName: text("player_name").notNull(),
    playerAge: integer("player_age"),
    ageGroup: text("age_group").notNull().default(""),
    area: text("area").notNull().default(""),
    programInterest: text("program_interest"),
    howHeard: text("how_heard").notNull().default(""),
    additionalInfo: text("additional_info"),
    utmSource: text("utm_source").notNull().default("direct"),
    utmMedium: text("utm_medium").notNull().default("direct"),
    utmCampaign: text("utm_campaign").notNull().default("direct"),
    landingPage: text("landing_page").notNull().default(""),
    referrer: text("referrer").notNull().default(""),
    sourcePage: text("source_page").notNull().default("home"),
    status: text("status").notNull().default("New"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    check(
      "trial_bookings_status_check",
      sql`${table.status} IN ('New', 'Qualified', 'Not Qualified', 'Booked Free Appointment', 'Didn''t show up', 'Converted Lead')`
    ),
  ]
);

export const insertTrialBookingSchema = createInsertSchema(trialBookings).omit({
  id: true,
  status: true,
  createdAt: true,
});

export type InsertTrialBooking = z.infer<typeof insertTrialBookingSchema>;
export type TrialBooking = typeof trialBookings.$inferSelect;

// ---- Shared trial-booking form validation (used by client and server) ----

export const AGE_GROUPS = ["4–6 years", "7–10 years", "11–18 years"] as const;

export const AREAS = [
  "Al Barsha",
  "Al Quoz",
  "Bluewaters Island",
  "Bur Dubai",
  "Business Bay",
  "Deira",
  "DIFC",
  "Dubai Internet City / Dubai Media City",
  "Dubai Marina",
  "Dubai Silicon Oasis",
  "Dubai South",
  "Dubailand",
  "Downtown Dubai",
  "International City",
  "JBR",
  "Jebel Ali",
  "Jumeirah",
  "Mirdif",
  "Palm Jumeirah",
  "Sheikh Zayed Road Corridor",
  "Other / Outside Dubai",
] as const;

export const LEVELS = ["Beginner", "Some experience", "Plays competitively"] as const;

export const HOW_HEARD_OPTIONS = [
  "Instagram",
  "TikTok",
  "Google Search",
  "Friend/Referral",
  "School",
  "Event",
  "Walk-in",
  "Other",
] as const;

const NAME_REGEX = /^[A-Za-z\u00C0-\u024F]+(?:[ '\-][A-Za-z\u00C0-\u024F]+)*$/;

// Normalize dash/apostrophe look-alikes (smart quotes, en/em dashes) that
// iOS/macOS text fields and pasted text commonly substitute for a plain
// "-" or "'", so a real name like "Anne\u2013Marie" or "O'Connor" isn't rejected.
const normalizeNameInput = (value: unknown) =>
  typeof value === "string"
    ? value.replace(/[\u2010-\u2015\u2212]/g, "-").replace(/[\u2018\u2019\u02BC\u00B4`]/g, "'")
    : value;

export const nameField = (label: string) =>
  z.preprocess(
    normalizeNameInput,
    z
      .string()
      .trim()
      .min(2, `${label} must be at least 2 characters`)
      .regex(NAME_REGEX, `${label} can only contain letters, spaces, hyphens and apostrophes`)
  );

/** Full international phone, e.g. +971501234567 (spaces/dashes/brackets already stripped). */
export const phoneField = z
  .string()
  .trim()
  .regex(/^\+\d{7,15}$/, "Please enter a valid phone number")
  .refine(
    (v) => !v.startsWith("+971") || /^\+971\d{9}$/.test(v),
    "Please enter a valid UAE phone number (9 digits after +971)"
  );

export const stripHtml = (v: string) => v.replace(/<[^>]*>/g, "").trim();

export const trialBookingFormSchema = z.object({
  parentName: nameField("Parent/Guardian name"),
  playerName: nameField("Child's name"),
  ageGroup: z.enum(AGE_GROUPS, { errorMap: () => ({ message: "Please select an age group" }) }),
  area: z.enum(AREAS, { errorMap: () => ({ message: "Please select your area" }) }),
  programInterest: z.enum(LEVELS).optional().or(z.literal("")).transform((v) => v || null),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address"),
  phone: phoneField,
  whatsapp: z.boolean().default(false),
  howHeard: z.enum(HOW_HEARD_OPTIONS, {
    errorMap: () => ({ message: "Please tell us how you heard about us" }),
  }),
  additionalInfo: z
    .string()
    .max(500, "Notes must be 500 characters or fewer")
    .transform(stripHtml)
    .optional()
    .transform((v) => v || null),
  utmSource: z.string().trim().max(200).optional().transform((v) => v || "direct"),
  utmMedium: z.string().trim().max(200).optional().transform((v) => v || "direct"),
  utmCampaign: z.string().trim().max(200).optional().transform((v) => v || "direct"),
  landingPage: z.string().trim().max(1000).optional().transform((v) => v || ""),
  referrer: z.string().trim().max(1000).optional().transform((v) => v || ""),
  sourcePage: z.string().trim().max(100).optional().transform((v) => v || "home"),
  // Spam protection
  website: z.string().max(0, "Invalid submission").optional().or(z.literal("")),
  formStartedAt: z.number().optional(),
});

export type TrialBookingFormInput = z.input<typeof trialBookingFormSchema>;
export type TrialBookingFormData = z.output<typeof trialBookingFormSchema>;

// ---- General contact enquiries (separate from trial bookings) ----

export const contactEnquiries = pgTable("contact_enquiries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  utmSource: text("utm_source").notNull().default("direct"),
  utmMedium: text("utm_medium").notNull().default("direct"),
  utmCampaign: text("utm_campaign").notNull().default("direct"),
  landingPage: text("landing_page").notNull().default(""),
  referrer: text("referrer").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertContactEnquirySchema = createInsertSchema(contactEnquiries).omit({
  id: true,
  createdAt: true,
});

export type InsertContactEnquiry = z.infer<typeof insertContactEnquirySchema>;
export type ContactEnquiry = typeof contactEnquiries.$inferSelect;

export const CONTACT_SUBJECTS = [
  "General enquiry",
  "Programs & pricing",
  "Partnerships & schools",
  "Media",
  "Careers",
] as const;

export const contactEnquiryFormSchema = z.object({
  name: nameField("Name"),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address"),
  phone: phoneField,
  subject: z.enum(CONTACT_SUBJECTS, { errorMap: () => ({ message: "Please select a subject" }) }),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message must be 2000 characters or fewer")
    .transform(stripHtml),
  utmSource: z.string().trim().max(200).optional().transform((v) => v || "direct"),
  utmMedium: z.string().trim().max(200).optional().transform((v) => v || "direct"),
  utmCampaign: z.string().trim().max(200).optional().transform((v) => v || "direct"),
  landingPage: z.string().trim().max(1000).optional().transform((v) => v || ""),
  referrer: z.string().trim().max(1000).optional().transform((v) => v || ""),
  // Spam protection
  website: z.string().max(0, "Invalid submission").optional().or(z.literal("")),
  formStartedAt: z.number().optional(),
});

export type ContactEnquiryFormInput = z.input<typeof contactEnquiryFormSchema>;
export type ContactEnquiryFormData = z.output<typeof contactEnquiryFormSchema>;

export const eventRegistrations = pgTable(
  "event_registrations",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    eventId: text("event_id").notNull(),
    eventTitle: text("event_title").notNull(),
    parentName: text("parent_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    playerName: text("player_name").notNull(),
    playerAge: integer("player_age").notNull(),
    status: text("status").notNull().default("New"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    check(
      "event_registrations_status_check",
      sql`${table.status} IN ('New', 'Qualified', 'Not Qualified', 'Booked Free Appointment', 'Didn''t show up', 'Converted Lead')`
    ),
  ]
);

export const insertEventRegistrationSchema = createInsertSchema(eventRegistrations).omit({
  id: true,
  status: true,
  createdAt: true,
});

export type InsertEventRegistration = z.infer<typeof insertEventRegistrationSchema>;
export type EventRegistration = typeof eventRegistrations.$inferSelect;

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  date: text("date").notNull(),
  endDate: text("end_date"),
  time: text("time").notNull(),
  location: text("location").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("Registration Open"),
  price: text("price"),
  image: text("image"),
  imageAlt: text("image_alt"),
  category: text("category").default("Camp"),
  featured: boolean("featured").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEventSchema = createInsertSchema(events)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format"),
  });

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

// ---- Blog ----

export const blogCategories = pgTable(
  "blog_categories",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull().unique(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    parentId: integer("parent_id").references(
      (): AnyPgColumn => blogCategories.id,
      { onDelete: "set null" }
    ),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_blog_cat_order").on(table.displayOrder, table.name),
  ]
);

export const insertBlogCategorySchema = createInsertSchema(blogCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBlogCategory = z.infer<typeof insertBlogCategorySchema>;
export type BlogCategory = typeof blogCategories.$inferSelect;

export const blogPosts = pgTable(
  "blog_posts",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    excerpt: text("excerpt"),
    content: text("content").notNull(),
    featuredImageSrc: text("featured_image_src"),
    featuredImageAlt: text("featured_image_alt"),
    authorName: text("author_name").notNull(),
    status: text("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    isFeatured: boolean("is_featured").notNull().default(false),
    viewCount: integer("view_count").notNull().default(0),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    ogTitle: text("og_title"),
    ogDescription: text("og_description"),
    ogImage: text("og_image"),
    focusKeyword: text("focus_keyword"),
    noIndex: boolean("no_index").notNull().default(false),
    visibility: text("visibility").notNull().default("public"),
    passwordHash: text("password_hash"),
    lockModifiedDate: boolean("lock_modified_date").notNull().default(false),
    schemaEnabled: boolean("schema_enabled").notNull().default(true),
    trashedAt: timestamp("trashed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    // PostgreSQL supplies this generated tsvector through a handwritten
    // migration. It is intentionally omitted from the insert schema.
    searchVector: text("search_vector"),
  },
  (table) => [
    check(
      "blog_posts_status_check",
      sql`${table.status} IN ('draft', 'published', 'scheduled')`
    ),
    check(
      "blog_posts_visibility_check",
      sql`${table.visibility} IN ('public', 'private', 'password')`
    ),
    index("idx_blog_posts_live").on(
      table.status,
      sql`${table.publishedAt} DESC`
    ),
  ]
);

export const blogPasswordAttempts = pgTable("blog_password_attempts", {
  postId: integer("post_id").notNull().references(() => blogPosts.id, { onDelete: "cascade" }),
  clientKey: text("client_key").notNull(),
  attemptCount: integer("attempt_count").notNull().default(0),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
}, (table) => [primaryKey({ columns: [table.postId, table.clientKey] })]);

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  searchVector: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;

export const blogPostCategories = pgTable(
  "blog_post_categories",
  {
    postId: integer("post_id")
      .notNull()
      .references(() => blogPosts.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => blogCategories.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({
      name: "blog_post_categories_pkey",
      columns: [table.postId, table.categoryId],
    }),
    index("idx_blog_postcat_cat").on(table.categoryId),
  ]
);

export type BlogPostCategory = typeof blogPostCategories.$inferSelect;

export const blogTags = pgTable("blog_tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
});

export const insertBlogTagSchema = createInsertSchema(blogTags).omit({
  id: true,
});

export type InsertBlogTag = z.infer<typeof insertBlogTagSchema>;
export type BlogTag = typeof blogTags.$inferSelect;

export const blogPostTags = pgTable(
  "blog_post_tags",
  {
    postId: integer("post_id")
      .notNull()
      .references(() => blogPosts.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => blogTags.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({
      name: "blog_post_tags_pkey",
      columns: [table.postId, table.tagId],
    }),
  ]
);

export type BlogPostTag = typeof blogPostTags.$inferSelect;

export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
});

export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;

// ---- SEO Manager ----
// All override columns are nullable on purpose: a NULL/blank value means
// "no override" and the code-defined default is used instead.

export const seoPages = pgTable("seo_pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  path: text("path").notNull().unique(),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  canonicalUrl: text("canonical_url"),
  ogTitle: text("og_title"),
  ogDescription: text("og_description"),
  ogImage: text("og_image"),
  noIndex: boolean("no_index"),
  noFollow: boolean("no_follow"),
  focusKeyword: text("focus_keyword"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type SeoPage = typeof seoPages.$inferSelect;

/** Optional, per-page customisations. Null means inherit the computed default. */
export const seoSchemaOverrides = pgTable("seo_schema_overrides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  path: text("path").notNull().unique(),
  schemaType: text("schema_type").notNull(),
  /** Full JSON-LD array replacement for the whole page; null inherits the computed default. */
  overrides: jsonb("overrides").$type<Record<string, unknown>[] | null>(),
  enabled: boolean("enabled").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type SeoSchemaOverride = typeof seoSchemaOverrides.$inferSelect;

const optionalText = (max: number) =>
  z
    .string()
    .max(max, `Must be ${max} characters or fewer`)
    .transform(stripHtml)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

/**
 * Hosts this site is allowed to send visitors to. Anything else would turn an
 * admin-editable redirect into an open redirect on a trusted domain.
 */
const SITE_HOSTS = new Set(["valenciabasket.ae", "www.valenciabasket.ae"]);

/**
 * Internal absolute path such as "/programs/mini-basket" (no host, no protocol).
 * "//evil.example" is a protocol-relative URL, not a path, so it is rejected.
 */
const internalPath = z
  .string()
  .trim()
  .max(500)
  .regex(/^\/[A-Za-z0-9\-._~/]*$/, "Must be an internal path starting with /")
  .refine((v) => !v.startsWith("//"), "Path may not start with '//'")
  .refine((v) => !v.includes("//"), "Path may not contain '//'")
  .refine((v) => !v.includes(".."), "Path may not contain '..'")
  .refine((v) => v === "/" || !v.endsWith("/"), "Path may not end with a trailing slash");

/** True for an internal path or an absolute http(s) URL on one of our own hosts. */
function isSafeSiteUrl(value: string): boolean {
  if (
    value.startsWith("//") ||
    value.includes("..") ||
    /[\\\u0000-\u001f\u007f]/.test(value)
  ) {
    return false;
  }
  if (value.startsWith("/")) return !value.includes("//") && !value.includes("..");
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && SITE_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

/**
 * Collapses an approved same-site absolute URL to the internal path it points
 * at, so every stored destination is in one comparable form. Without this,
 * "/old" -> "https://valenciabasket.ae/old" reads as two different values and
 * slips past loop detection while redirecting to itself forever.
 */
function toInternalDestination(value: string): string {
  let path = value;
  if (!path.startsWith("/")) {
    const url = new URL(path);
    path = `${url.pathname}${url.search}${url.hash}`;
  }
  const [pathname, rest] = [path.split(/[?#]/)[0], path.slice(path.split(/[?#]/)[0].length)];
  const trimmed = pathname.length > 1 ? pathname.replace(/\/+$/, "") || "/" : pathname;
  return `${trimmed}${rest}`;
}

/** Same as above but any https host is allowed — images may live on a CDN. */
function isSafeImageUrl(value: string): boolean {
  if (value.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(value)) return false;
  if (value.startsWith("/")) return !value.includes("//") && !value.includes("..");
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export const seoPageOverrideSchema = z.object({
  path: internalPath,
  metaTitle: optionalText(200),
  metaDescription: optionalText(400),
  canonicalUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null))
    .refine(
      (v) => v === null || isSafeSiteUrl(v),
      "Canonical must be an internal path or a full URL on valenciabasket.ae"
    ),
  ogTitle: optionalText(200),
  ogDescription: optionalText(400),
  ogImage: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null))
    .refine(
      (v) => v === null || isSafeImageUrl(v),
      "Social image must be an internal path or a full http(s) URL"
    ),
  noIndex: z.boolean().optional().nullable().transform((v) => (v === undefined ? null : v)),
  noFollow: z.boolean().optional().nullable().transform((v) => (v === undefined ? null : v)),
  focusKeyword: optionalText(120),
});

export type SeoPageOverrideInput = z.input<typeof seoPageOverrideSchema>;
export type SeoPageOverride = z.output<typeof seoPageOverrideSchema>;

export const seoImageAlts = pgTable("seo_image_alts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  /**
   * Legacy placement key for rows written before file-level alt text. New
   * canonical rows use the stable `file:<src>` form, keeping the old rows
   * intact for a safe, reversible backfill.
   */
  imageKey: text("image_key").notNull().unique(),
  /** Canonical image-file identity for current overrides. */
  imageSrc: text("image_src"),
  altText: text("alt_text"),
  isDecorative: boolean("is_decorative").notNull().default(false),
  /**
   * Set by the file-level migration when preserved placement descriptions
   * disagree. It stays set until an administrator explicitly reviews it.
   */
  needsReview: boolean("needs_review").notNull().default(false),
  reviewedAt: timestamp("reviewed_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type SeoImageAlt = typeof seoImageAlts.$inferSelect;

export const seoImageAltSchema = z.object({
  imageSrc: z.string().trim().min(1).max(500),
  altText: optionalText(300),
  isDecorative: z.boolean().default(false),
});

export const seoRedirects = pgTable("seo_redirects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  source: text("source").notNull().unique(),
  destination: text("destination").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type SeoRedirect = typeof seoRedirects.$inferSelect;

export const seoRedirectSchema = z.object({
  source: internalPath,
  destination: z
    .string()
    .trim()
    .max(500)
    .refine(
      isSafeSiteUrl,
      "Destination must be an internal path or a full URL on valenciabasket.ae"
    )
    .transform(toInternalDestination),
  enabled: z.boolean().default(true),
});

export type SeoRedirectInput = z.input<typeof seoRedirectSchema>;

export const adminSessions = pgTable("admin_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AdminSession = typeof adminSessions.$inferSelect;

/** Admin-editable page content. Null/missing means inherit the code default. */
export const pageContentOverrides = pgTable("page_content_overrides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type PageContentOverride = typeof pageContentOverrides.$inferSelect;

/**
 * Staff page members, edited in Admin → Staff. Maros and Martin are blog
 * authors (is_author): their slugs back /blog/author/<slug>, so they can be
 * hidden but never deleted. Filled from lib/content/staff.ts defaults the
 * first time the admin Staff tab loads; until then the site uses the defaults.
 */
export const staffMembers = pgTable("staff_members", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  section: text("section").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  bio: text("bio").notNull().default(""),
  image: text("image").notNull().default(""),
  imageKey: text("image_key"),
  sortOrder: integer("sort_order").notNull().default(0),
  visible: boolean("visible").notNull().default(true),
  isAuthor: boolean("is_author").notNull().default(false),
  authorBio: text("author_bio"),
  instagram: text("instagram"),
  facebook: text("facebook"),
  tiktok: text("tiktok"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type StaffMemberRow = typeof staffMembers.$inferSelect;
export type InsertStaffMemberRow = typeof staffMembers.$inferInsert;

/**
 * FAQ page questions, edited in Admin → FAQs. Filled from lib/content/faq.ts
 * defaults the first time the admin FAQs tab loads; until then the site uses
 * the defaults. `answer` is plain text with light formatting (see faq.ts).
 */
export const faqItems = pgTable("faq_items", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  section: text("section").notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  visible: boolean("visible").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type FaqItemRow = typeof faqItems.$inferSelect;
export type InsertFaqItemRow = typeof faqItems.$inferInsert;

/**
 * Instagram reels shown on the site, edited in Admin → Page Content → Instagram
 * reels. `target` is where a reel appears: "homepage" or a program slug.
 */
export const reelItems = pgTable("reel_items", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  caption: text("caption").notNull(),
  target: text("target").notNull(),
  poster: text("poster"),
  sortOrder: integer("sort_order").notNull().default(0),
  visible: boolean("visible").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ReelItemRow = typeof reelItems.$inferSelect;
export type InsertReelItemRow = typeof reelItems.$inferInsert;

/**
 * Video testimonials shown in the homepage "Community Stories" block, edited in
 * Admin → Page Content → Video testimonials. `url` is a Google Drive share link.
 */
export const videoTestimonials = pgTable("video_testimonials", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default(""),
  quote: text("quote").notNull().default(""),
  poster: text("poster"),
  sortOrder: integer("sort_order").notNull().default(0),
  visible: boolean("visible").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type VideoTestimonialRow = typeof videoTestimonials.$inferSelect;
export type InsertVideoTestimonialRow = typeof videoTestimonials.$inferInsert;
