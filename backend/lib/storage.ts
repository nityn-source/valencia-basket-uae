import { 
  type TrialBooking, 
  type InsertTrialBooking,
  type ContactEnquiry,
  type InsertContactEnquiry,
  type EventRegistration,
  type InsertEventRegistration,
  type LeadStatus,
  type Event,
  type InsertEvent,
  type AdminUser,
  type AdminSession,
  type SeoPage,
  type SeoPageOverride,
  type SeoImageAlt,
  type SeoRedirect,
  type SeoSchemaOverride,
  type PageContentOverride,
  type StaffMemberRow,
  type InsertStaffMemberRow,
  type FaqItemRow,
  type InsertFaqItemRow,
  type ReelItemRow,
  type InsertReelItemRow,
  type VideoTestimonialRow,
  type InsertVideoTestimonialRow,
  type BlogPost,
  type BlogCategory,
  type BlogTag,
  type InsertBlogPost,
  trialBookings,
  contactEnquiries,
  eventRegistrations,
  events,
  adminUsers,
  adminSessions,
  seoPages,
  seoImageAlts,
  seoRedirects,
  seoSchemaOverrides,
  pageContentOverrides,
  staffMembers,
  faqItems,
  reelItems,
  videoTestimonials,
  blogPosts,
  blogCategories,
  blogTags,
  blogPostCategories,
  blogPostTags,
  blogPasswordAttempts,
} from "@shared/schema";
import { db } from "@/db";
import { desc, eq, asc, isNotNull, isNull, lt, sql, and, or, lte } from "drizzle-orm";

export type BlogPostWithTaxonomy = BlogPost & {
  categories: BlogCategory[];
  tags: BlogTag[];
};

export type SafeBlogPost = Omit<BlogPostWithTaxonomy, "passwordHash">;

export type BlogPostWriteInput = InsertBlogPost & {
  categoryNames?: string[];
  tagNames?: string[];
  password?: string | null;
};

export type BlogTagWithUsage = BlogTag & { usage: number };
export type BlogCategoryWithUsage = BlogCategory & { usage: number };

function blogTaxonomySlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function taxonomyConflict(kind: "category" | "tag", name: string, slug: string) {
  const error = new Error(`The ${kind} "${name}" conflicts with an existing ${kind} using the slug "${slug}"`);
  Object.assign(error, { code: "BLOG_TAXONOMY_CONFLICT" });
  return error;
}

export async function syncBlogTaxonomy(
  tx: any,
  postId: number,
  categoryNames: string[] = [],
  tagNames: string[] = []
) {
  await tx.delete(blogPostCategories).where(eq(blogPostCategories.postId, postId));
  await tx.delete(blogPostTags).where(eq(blogPostTags.postId, postId));

  for (const name of [...new Set(categoryNames.map((value) => value.trim()).filter(Boolean))]) {
    const slug = blogTaxonomySlug(name);
    let [category] = await tx.select().from(blogCategories)
      .where(or(eq(blogCategories.name, name), eq(blogCategories.slug, slug)));
    if (category && category.name !== name) throw taxonomyConflict("category", name, slug);
    if (!category) {
      [category] = await tx.insert(blogCategories).values({ name, slug }).onConflictDoNothing().returning();
      if (!category) {
        [category] = await tx.select().from(blogCategories)
          .where(or(eq(blogCategories.name, name), eq(blogCategories.slug, slug)));
      }
    }
    if (!category || category.name !== name) throw taxonomyConflict("category", name, slug);
    await tx.insert(blogPostCategories).values({ postId, categoryId: category.id }).onConflictDoNothing();
  }

  for (const name of [...new Set(tagNames.map((value) => value.trim()).filter(Boolean))]) {
    const slug = blogTaxonomySlug(name);
    let [tag] = await tx.select().from(blogTags)
      .where(or(eq(blogTags.name, name), eq(blogTags.slug, slug)));
    if (tag && tag.name !== name) throw taxonomyConflict("tag", name, slug);
    if (!tag) {
      [tag] = await tx.insert(blogTags).values({ name, slug }).onConflictDoNothing().returning();
      if (!tag) {
        [tag] = await tx.select().from(blogTags)
          .where(or(eq(blogTags.name, name), eq(blogTags.slug, slug)));
      }
    }
    if (!tag || tag.name !== name) throw taxonomyConflict("tag", name, slug);
    await tx.insert(blogPostTags).values({ postId, tagId: tag.id }).onConflictDoNothing();
  }
}

export interface IStorage {
  createTrialBooking(booking: InsertTrialBooking): Promise<TrialBooking>;
  getAllTrialBookings(): Promise<TrialBooking[]>;
  updateTrialBookingStatus(id: string, status: LeadStatus): Promise<TrialBooking | undefined>;
  deleteTrialBooking(id: string): Promise<boolean>;

  createContactEnquiry(enquiry: InsertContactEnquiry): Promise<ContactEnquiry>;
  getAllContactEnquiries(): Promise<ContactEnquiry[]>;

  createEventRegistration(registration: InsertEventRegistration): Promise<EventRegistration>;
  getAllEventRegistrations(): Promise<EventRegistration[]>;
  updateEventRegistrationStatus(id: string, status: LeadStatus): Promise<EventRegistration | undefined>;
  deleteEventRegistration(id: string): Promise<boolean>;

  getAllEvents(): Promise<Event[]>;
  getEventBySlug(slug: string): Promise<Event | undefined>;
  getEventById(id: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event>;
  deleteEvent(id: string): Promise<void>;

  getAllBlogPosts(): Promise<BlogPostWithTaxonomy[]>;
  getPublishedBlogPosts(): Promise<BlogPostWithTaxonomy[]>;
  getBlogPostBySlug(slug: string, includeUnpublished?: boolean): Promise<BlogPostWithTaxonomy | undefined>;
  getBlogPostById(id: number): Promise<BlogPostWithTaxonomy | undefined>;
  createBlogPost(input: BlogPostWriteInput): Promise<BlogPostWithTaxonomy>;
  updateBlogPost(id: number, input: Partial<BlogPostWriteInput>): Promise<BlogPostWithTaxonomy>;
  deleteBlogPost(id: number): Promise<void>;
  consumeBlogPasswordAttempt(postId: number, clientKey: string, maximum: number, windowMinutes: number): Promise<{ allowed: boolean; retryAfterSeconds: number }>;
  clearBlogPasswordAttempts(postId: number, clientKey: string): Promise<void>;
  getBlogCategories(): Promise<BlogCategoryWithUsage[]>;
  getBlogTagsMostUsed(): Promise<BlogTagWithUsage[]>;
  createBlogCategory(name: string): Promise<BlogCategory>;
  createBlogTag(name: string): Promise<BlogTag>;

  getAdminByUsername(username: string): Promise<AdminUser | undefined>;
  getAllAdminUsers(): Promise<AdminUser[]>;
  createAdminUser(username: string, passwordHash: string, role?: string): Promise<AdminUser>;
  deleteAdminUser(id: string): Promise<void>;
  updateAdminPassword(id: string, passwordHash: string): Promise<void>;

  getAllSeoPages(): Promise<SeoPage[]>;
  upsertSeoPage(override: SeoPageOverride): Promise<SeoPage>;
  deleteSeoPage(path: string): Promise<void>;
  getAllSeoSchemaOverrides(): Promise<SeoSchemaOverride[]>;
  upsertSeoSchemaOverride(path: string, schemaType: string, enabled: boolean, overrides: Record<string, unknown>[] | null): Promise<SeoSchemaOverride>;
  deleteSeoSchemaOverride(path: string): Promise<void>;
  getAllPageContentOverrides(): Promise<PageContentOverride[]>;
  upsertPageContentOverride(key: string, value: string): Promise<PageContentOverride>;
  deletePageContentOverride(key: string): Promise<void>;

  getStaffMembers(): Promise<StaffMemberRow[]>;
  getStaffMemberById(id: number): Promise<StaffMemberRow | undefined>;
  seedStaffMembers(rows: InsertStaffMemberRow[]): Promise<void>;
  createStaffMember(row: InsertStaffMemberRow): Promise<StaffMemberRow>;
  updateStaffMember(id: number, changes: Partial<InsertStaffMemberRow>): Promise<StaffMemberRow | undefined>;
  deleteStaffMember(id: number): Promise<void>;
  reorderStaffMembers(section: string, ids: number[]): Promise<void>;

  getFaqItems(): Promise<FaqItemRow[]>;
  getFaqItemById(id: number): Promise<FaqItemRow | undefined>;
  seedFaqItems(rows: InsertFaqItemRow[]): Promise<void>;
  createFaqItem(row: InsertFaqItemRow): Promise<FaqItemRow>;
  updateFaqItem(id: number, changes: Partial<InsertFaqItemRow>): Promise<FaqItemRow | undefined>;
  deleteFaqItem(id: number): Promise<void>;
  reorderFaqItems(section: string, ids: number[]): Promise<void>;

  getReelItems(): Promise<ReelItemRow[]>;
  getReelItemById(id: number): Promise<ReelItemRow | undefined>;
  createReelItem(row: InsertReelItemRow): Promise<ReelItemRow>;
  updateReelItem(id: number, changes: Partial<InsertReelItemRow>): Promise<ReelItemRow | undefined>;
  deleteReelItem(id: number): Promise<void>;
  reorderReelItems(target: string, ids: number[]): Promise<void>;

  getVideoTestimonials(): Promise<VideoTestimonialRow[]>;
  getVideoTestimonialById(id: number): Promise<VideoTestimonialRow | undefined>;
  createVideoTestimonial(row: InsertVideoTestimonialRow): Promise<VideoTestimonialRow>;
  updateVideoTestimonial(id: number, changes: Partial<InsertVideoTestimonialRow>): Promise<VideoTestimonialRow | undefined>;
  deleteVideoTestimonial(id: number): Promise<void>;
  reorderVideoTestimonials(ids: number[]): Promise<void>;

  getAllSeoImageAltFiles(): Promise<SeoImageAlt[]>;
  getAllSeoImageAlts(): Promise<SeoImageAlt[]>;
  getSeoImageAltFile(imageSrc: string): Promise<SeoImageAlt | undefined>;
  upsertSeoImageAltFile(
    imageSrc: string,
    altText: string | null,
    isDecorative: boolean
  ): Promise<SeoImageAlt>;
  resolveSeoImageAltConflict(
    imageSrc: string,
    altText: string | null,
    isDecorative: boolean
  ): Promise<SeoImageAlt>;
  deleteSeoImageAltFile(imageSrc: string): Promise<void>;

  getAllSeoRedirects(): Promise<SeoRedirect[]>;
  getSeoRedirectById(id: string): Promise<SeoRedirect | undefined>;
  getSeoRedirectBySource(source: string): Promise<SeoRedirect | undefined>;
  createSeoRedirect(data: { source: string; destination: string; enabled: boolean }): Promise<SeoRedirect>;
  updateSeoRedirect(id: string, data: { source: string; destination: string; enabled: boolean }): Promise<SeoRedirect>;
  deleteSeoRedirect(id: string): Promise<void>;

  createSession(userId: string, token: string, expiresAt: Date): Promise<AdminSession>;
  getSessionByToken(token: string): Promise<AdminSession | undefined>;
  deleteSession(token: string): Promise<void>;
  cleanExpiredSessions(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createTrialBooking(booking: InsertTrialBooking): Promise<TrialBooking> {
    const [result] = await db.insert(trialBookings).values(booking).returning();
    return result;
  }

  async getAllTrialBookings(): Promise<TrialBooking[]> {
    return db.select().from(trialBookings).orderBy(desc(trialBookings.createdAt));
  }

  async updateTrialBookingStatus(id: string, status: LeadStatus): Promise<TrialBooking | undefined> {
    const [result] = await db
      .update(trialBookings)
      .set({ status })
      .where(eq(trialBookings.id, id))
      .returning();
    return result;
  }

  async deleteTrialBooking(id: string): Promise<boolean> {
    const result = await db.delete(trialBookings).where(eq(trialBookings.id, id)).returning({ id: trialBookings.id });
    return result.length > 0;
  }

  async createContactEnquiry(enquiry: InsertContactEnquiry): Promise<ContactEnquiry> {
    const [result] = await db.insert(contactEnquiries).values(enquiry).returning();
    return result;
  }

  async getAllContactEnquiries(): Promise<ContactEnquiry[]> {
    return db.select().from(contactEnquiries).orderBy(desc(contactEnquiries.createdAt));
  }

  async createEventRegistration(registration: InsertEventRegistration): Promise<EventRegistration> {
    const [result] = await db.insert(eventRegistrations).values(registration).returning();
    return result;
  }

  async getAllEventRegistrations(): Promise<EventRegistration[]> {
    return db.select().from(eventRegistrations).orderBy(desc(eventRegistrations.createdAt));
  }

  async updateEventRegistrationStatus(id: string, status: LeadStatus): Promise<EventRegistration | undefined> {
    const [result] = await db
      .update(eventRegistrations)
      .set({ status })
      .where(eq(eventRegistrations.id, id))
      .returning();
    return result;
  }

  async deleteEventRegistration(id: string): Promise<boolean> {
    const result = await db
      .delete(eventRegistrations)
      .where(eq(eventRegistrations.id, id))
      .returning({ id: eventRegistrations.id });
    return result.length > 0;
  }

  async getAllEvents(): Promise<Event[]> {
    return db.select().from(events).orderBy(asc(events.createdAt));
  }

  async getEventBySlug(slug: string): Promise<Event | undefined> {
    const [result] = await db.select().from(events).where(eq(events.slug, slug));
    return result;
  }

  async getEventById(id: string): Promise<Event | undefined> {
    const [result] = await db.select().from(events).where(eq(events.id, id));
    return result;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [result] = await db.insert(events).values(event).returning();
    return result;
  }

  async updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event> {
    const [result] = await db.update(events).set(event).where(eq(events.id, id)).returning();
    return result;
  }

  async deleteEvent(id: string): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  private async withBlogTaxonomy(post: BlogPost): Promise<BlogPostWithTaxonomy> {
    const [categories, tags] = await Promise.all([
      db.select({ category: blogCategories }).from(blogPostCategories).innerJoin(blogCategories, eq(blogPostCategories.categoryId, blogCategories.id)).where(eq(blogPostCategories.postId, post.id)),
      db.select({ tag: blogTags }).from(blogPostTags).innerJoin(blogTags, eq(blogPostTags.tagId, blogTags.id)).where(eq(blogPostTags.postId, post.id)),
    ]);
    return { ...post, categories: categories.map(({ category }) => category), tags: tags.map(({ tag }) => tag) };
  }

  async getAllBlogPosts(): Promise<BlogPostWithTaxonomy[]> {
    const posts = await db.select().from(blogPosts).where(isNull(blogPosts.trashedAt)).orderBy(desc(blogPosts.updatedAt));
    return Promise.all(posts.map((post) => this.withBlogTaxonomy(post)));
  }

  async getPublishedBlogPosts(): Promise<BlogPostWithTaxonomy[]> {
    const now = new Date();
    const posts = await db.select().from(blogPosts)
      .where(and(isNull(blogPosts.trashedAt), or(eq(blogPosts.visibility, "public"), eq(blogPosts.visibility, "password")), or(eq(blogPosts.status, "published"), eq(blogPosts.status, "scheduled")), lte(blogPosts.publishedAt, now)))
      .orderBy(desc(blogPosts.publishedAt), desc(blogPosts.updatedAt));
    return Promise.all(posts.map((post) => this.withBlogTaxonomy(post)));
  }

  async getBlogPostBySlug(slug: string, includeUnpublished = false): Promise<BlogPostWithTaxonomy | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    if (!post || post.trashedAt || (!includeUnpublished && !(post.visibility === "public" && (post.status === "published" || post.status === "scheduled") && post.publishedAt && post.publishedAt <= new Date()))) return undefined;
    return this.withBlogTaxonomy(post);
  }

  async getBlogPostById(id: number): Promise<BlogPostWithTaxonomy | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    return post ? this.withBlogTaxonomy(post) : undefined;
  }

  async createBlogPost(input: BlogPostWriteInput): Promise<BlogPostWithTaxonomy> {
    const { categoryNames, tagNames, password, ...postInput } = input;
    return db.transaction(async (tx) => {
      const [post] = await tx.insert(blogPosts).values(postInput).returning();
      await syncBlogTaxonomy(tx, post.id, categoryNames, tagNames);
      const [categories, tags] = await Promise.all([
        tx.select({ category: blogCategories }).from(blogPostCategories).innerJoin(blogCategories, eq(blogPostCategories.categoryId, blogCategories.id)).where(eq(blogPostCategories.postId, post.id)),
        tx.select({ tag: blogTags }).from(blogPostTags).innerJoin(blogTags, eq(blogPostTags.tagId, blogTags.id)).where(eq(blogPostTags.postId, post.id)),
      ]);
      return { ...post, categories: categories.map(({ category }) => category), tags: tags.map(({ tag }) => tag) };
    });
  }

  async updateBlogPost(id: number, input: Partial<BlogPostWriteInput>): Promise<BlogPostWithTaxonomy> {
    const { categoryNames, tagNames, password, ...postInput } = input;
    return db.transaction(async (tx) => {
      const [existing] = await tx.select().from(blogPosts).where(eq(blogPosts.id, id));
      if (!existing) throw new Error("Blog post not found");
      const [post] = await tx.update(blogPosts).set({
        ...postInput,
        updatedAt: postInput.lockModifiedDate ? existing.updatedAt : new Date(),
      }).where(eq(blogPosts.id, id)).returning();
      if (!post) throw new Error("Blog post not found");
      if (categoryNames || tagNames) await syncBlogTaxonomy(tx, id, categoryNames, tagNames);
      const [categories, tags] = await Promise.all([
        tx.select({ category: blogCategories }).from(blogPostCategories).innerJoin(blogCategories, eq(blogPostCategories.categoryId, blogCategories.id)).where(eq(blogPostCategories.postId, id)),
        tx.select({ tag: blogTags }).from(blogPostTags).innerJoin(blogTags, eq(blogPostTags.tagId, blogTags.id)).where(eq(blogPostTags.postId, id)),
      ]);
      return { ...post, categories: categories.map(({ category }) => category), tags: tags.map(({ tag }) => tag) };
    });
  }

  async deleteBlogPost(id: number): Promise<void> {
    await db.update(blogPosts).set({ trashedAt: new Date(), updatedAt: new Date() }).where(eq(blogPosts.id, id));
  }

  async consumeBlogPasswordAttempt(postId: number, clientKey: string, maximum: number, windowMinutes: number) {
    const [attempt] = await db.insert(blogPasswordAttempts).values({
      postId,
      clientKey,
      attemptCount: 1,
      resetAt: new Date(Date.now() + windowMinutes * 60_000),
    }).onConflictDoUpdate({
      target: [blogPasswordAttempts.postId, blogPasswordAttempts.clientKey],
      set: {
        attemptCount: sql`CASE WHEN ${blogPasswordAttempts.resetAt} <= now() THEN 1 ELSE ${blogPasswordAttempts.attemptCount} + 1 END`,
        resetAt: sql`CASE WHEN ${blogPasswordAttempts.resetAt} <= now() THEN now() + (${windowMinutes} * interval '1 minute') ELSE ${blogPasswordAttempts.resetAt} END`,
      },
    }).returning();
    const retryAfterSeconds = Math.max(1, Math.ceil((attempt.resetAt.getTime() - Date.now()) / 1000));
    return { allowed: attempt.attemptCount <= maximum, retryAfterSeconds };
  }

  async clearBlogPasswordAttempts(postId: number, clientKey: string) {
    await db.delete(blogPasswordAttempts).where(and(eq(blogPasswordAttempts.postId, postId), eq(blogPasswordAttempts.clientKey, clientKey)));
  }

  async getBlogCategories(): Promise<BlogCategoryWithUsage[]> {
    const rows = await db.select({
      category: blogCategories,
      usage: sql<number>`count(${blogPostCategories.postId})`,
    }).from(blogCategories)
      .leftJoin(blogPostCategories, eq(blogCategories.id, blogPostCategories.categoryId))
      .groupBy(blogCategories.id)
      .orderBy(asc(blogCategories.displayOrder), asc(blogCategories.name));
    return rows.map(({ category, usage }) => ({ ...category, usage: Number(usage) }));
  }

  async getBlogTagsMostUsed(): Promise<BlogTagWithUsage[]> {
    const rows = await db.select({
      tag: blogTags,
      usage: sql<number>`count(${blogPostTags.postId})`,
    }).from(blogTags)
      .leftJoin(blogPostTags, eq(blogTags.id, blogPostTags.tagId))
      .groupBy(blogTags.id)
      .orderBy(desc(sql`count(${blogPostTags.postId})`), asc(blogTags.name));
    return rows.map(({ tag, usage }) => ({ ...tag, usage: Number(usage) }));
  }

  async createBlogCategory(name: string): Promise<BlogCategory> {
    const slug = blogTaxonomySlug(name);
    const [existing] = await db.select().from(blogCategories).where(or(eq(blogCategories.name, name), eq(blogCategories.slug, slug)));
    if (existing) {
      if (existing.name === name) return existing;
      throw taxonomyConflict("category", name, slug);
    }
    const [category] = await db.insert(blogCategories).values({ name, slug }).returning();
    return category;
  }

  async createBlogTag(name: string): Promise<BlogTag> {
    const slug = blogTaxonomySlug(name);
    const [existing] = await db.select().from(blogTags).where(or(eq(blogTags.name, name), eq(blogTags.slug, slug)));
    if (existing) {
      if (existing.name === name) return existing;
      throw taxonomyConflict("tag", name, slug);
    }
    const [tag] = await db.insert(blogTags).values({ name, slug }).returning();
    return tag;
  }

  async getAdminByUsername(username: string): Promise<AdminUser | undefined> {
    const [result] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    return result;
  }

  async getAllAdminUsers(): Promise<AdminUser[]> {
    return db.select().from(adminUsers).orderBy(asc(adminUsers.username));
  }

  async createAdminUser(username: string, passwordHash: string, role: string = "admin"): Promise<AdminUser> {
    const [result] = await db.insert(adminUsers).values({ username, passwordHash, role }).returning();
    return result;
  }

  async deleteAdminUser(id: string): Promise<void> {
    await db.delete(adminUsers).where(eq(adminUsers.id, id));
  }

  async updateAdminPassword(id: string, passwordHash: string): Promise<void> {
    await db.update(adminUsers).set({ passwordHash }).where(eq(adminUsers.id, id));
  }

  async getAllSeoPages(): Promise<SeoPage[]> {
    return db.select().from(seoPages).orderBy(asc(seoPages.path));
  }

  async upsertSeoPage(override: SeoPageOverride): Promise<SeoPage> {
    const values = {
      path: override.path,
      metaTitle: override.metaTitle,
      metaDescription: override.metaDescription,
      canonicalUrl: override.canonicalUrl,
      ogTitle: override.ogTitle,
      ogDescription: override.ogDescription,
      ogImage: override.ogImage,
      noIndex: override.noIndex,
      noFollow: override.noFollow,
      focusKeyword: override.focusKeyword,
      updatedAt: new Date(),
    };
    const [result] = await db
      .insert(seoPages)
      .values(values)
      .onConflictDoUpdate({ target: seoPages.path, set: values })
      .returning();
    return result;
  }

  async deleteSeoPage(path: string): Promise<void> {
    await db.delete(seoPages).where(eq(seoPages.path, path));
  }

  async getAllSeoSchemaOverrides(): Promise<SeoSchemaOverride[]> {
    return db.select().from(seoSchemaOverrides).orderBy(asc(seoSchemaOverrides.path));
  }
  async upsertSeoSchemaOverride(path: string, schemaType: string, enabled: boolean, overrides: Record<string, unknown>[] | null): Promise<SeoSchemaOverride> {
    const values = { path, schemaType, enabled, overrides, updatedAt: new Date() };
    const [result] = await db.insert(seoSchemaOverrides).values(values)
      .onConflictDoUpdate({ target: seoSchemaOverrides.path, set: values }).returning();
    return result;
  }
  async deleteSeoSchemaOverride(path: string): Promise<void> {
    await db.delete(seoSchemaOverrides).where(eq(seoSchemaOverrides.path, path));
  }
  async getAllPageContentOverrides(): Promise<PageContentOverride[]> {
    return db.select().from(pageContentOverrides);
  }
  async upsertPageContentOverride(key: string, value: string): Promise<PageContentOverride> {
    const values = { key, value, updatedAt: new Date() };
    const [result] = await db.insert(pageContentOverrides).values(values)
      .onConflictDoUpdate({ target: pageContentOverrides.key, set: values }).returning();
    return result;
  }
  async deletePageContentOverride(key: string): Promise<void> {
    await db.delete(pageContentOverrides).where(eq(pageContentOverrides.key, key));
  }

  async getStaffMembers(): Promise<StaffMemberRow[]> {
    return db.select().from(staffMembers).orderBy(asc(staffMembers.sortOrder), asc(staffMembers.id));
  }

  async getStaffMemberById(id: number): Promise<StaffMemberRow | undefined> {
    const [row] = await db.select().from(staffMembers).where(eq(staffMembers.id, id));
    return row;
  }

  async seedStaffMembers(rows: InsertStaffMemberRow[]): Promise<void> {
    if (rows.length) await db.insert(staffMembers).values(rows).onConflictDoNothing({ target: staffMembers.slug });
  }

  async createStaffMember(row: InsertStaffMemberRow): Promise<StaffMemberRow> {
    const [created] = await db.insert(staffMembers).values(row).returning();
    return created;
  }

  async updateStaffMember(id: number, changes: Partial<InsertStaffMemberRow>): Promise<StaffMemberRow | undefined> {
    const [updated] = await db.update(staffMembers).set({ ...changes, updatedAt: new Date() }).where(eq(staffMembers.id, id)).returning();
    return updated;
  }

  async deleteStaffMember(id: number): Promise<void> {
    await db.delete(staffMembers).where(eq(staffMembers.id, id));
  }

  async reorderStaffMembers(section: string, ids: number[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (const [index, id] of ids.entries()) {
        await tx.update(staffMembers).set({ sortOrder: index, updatedAt: new Date() })
          .where(and(eq(staffMembers.id, id), eq(staffMembers.section, section)));
      }
    });
  }

  async getFaqItems(): Promise<FaqItemRow[]> {
    return db.select().from(faqItems).orderBy(asc(faqItems.sortOrder), asc(faqItems.id));
  }

  async getFaqItemById(id: number): Promise<FaqItemRow | undefined> {
    const [row] = await db.select().from(faqItems).where(eq(faqItems.id, id));
    return row;
  }

  async seedFaqItems(rows: InsertFaqItemRow[]): Promise<void> {
    if (rows.length) await db.insert(faqItems).values(rows).onConflictDoNothing({ target: faqItems.slug });
  }

  async createFaqItem(row: InsertFaqItemRow): Promise<FaqItemRow> {
    const [created] = await db.insert(faqItems).values(row).returning();
    return created;
  }

  async updateFaqItem(id: number, changes: Partial<InsertFaqItemRow>): Promise<FaqItemRow | undefined> {
    const [updated] = await db.update(faqItems).set({ ...changes, updatedAt: new Date() }).where(eq(faqItems.id, id)).returning();
    return updated;
  }

  async deleteFaqItem(id: number): Promise<void> {
    await db.delete(faqItems).where(eq(faqItems.id, id));
  }

  async reorderFaqItems(section: string, ids: number[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (const [index, id] of ids.entries()) {
        await tx.update(faqItems).set({ sortOrder: index, updatedAt: new Date() })
          .where(and(eq(faqItems.id, id), eq(faqItems.section, section)));
      }
    });
  }

  async getReelItems(): Promise<ReelItemRow[]> {
    return db.select().from(reelItems).orderBy(asc(reelItems.sortOrder), asc(reelItems.id));
  }

  async getReelItemById(id: number): Promise<ReelItemRow | undefined> {
    const [row] = await db.select().from(reelItems).where(eq(reelItems.id, id));
    return row;
  }

  async createReelItem(row: InsertReelItemRow): Promise<ReelItemRow> {
    const [created] = await db.insert(reelItems).values(row).returning();
    return created;
  }

  async updateReelItem(id: number, changes: Partial<InsertReelItemRow>): Promise<ReelItemRow | undefined> {
    const [updated] = await db.update(reelItems).set({ ...changes, updatedAt: new Date() }).where(eq(reelItems.id, id)).returning();
    return updated;
  }

  async deleteReelItem(id: number): Promise<void> {
    await db.delete(reelItems).where(eq(reelItems.id, id));
  }

  async reorderReelItems(target: string, ids: number[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (const [index, id] of ids.entries()) {
        await tx.update(reelItems).set({ sortOrder: index, updatedAt: new Date() })
          .where(and(eq(reelItems.id, id), eq(reelItems.target, target)));
      }
    });
  }

  async getVideoTestimonials(): Promise<VideoTestimonialRow[]> {
    return db.select().from(videoTestimonials).orderBy(asc(videoTestimonials.sortOrder), asc(videoTestimonials.id));
  }

  async getVideoTestimonialById(id: number): Promise<VideoTestimonialRow | undefined> {
    const [row] = await db.select().from(videoTestimonials).where(eq(videoTestimonials.id, id));
    return row;
  }

  async createVideoTestimonial(row: InsertVideoTestimonialRow): Promise<VideoTestimonialRow> {
    const [created] = await db.insert(videoTestimonials).values(row).returning();
    return created;
  }

  async updateVideoTestimonial(id: number, changes: Partial<InsertVideoTestimonialRow>): Promise<VideoTestimonialRow | undefined> {
    const [updated] = await db.update(videoTestimonials).set({ ...changes, updatedAt: new Date() }).where(eq(videoTestimonials.id, id)).returning();
    return updated;
  }

  async deleteVideoTestimonial(id: number): Promise<void> {
    await db.delete(videoTestimonials).where(eq(videoTestimonials.id, id));
  }

  async reorderVideoTestimonials(ids: number[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (const [index, id] of ids.entries()) {
        await tx.update(videoTestimonials).set({ sortOrder: index, updatedAt: new Date() }).where(eq(videoTestimonials.id, id));
      }
    });
  }

  async getAllSeoImageAltFiles(): Promise<SeoImageAlt[]> {
    return db
      .select()
      .from(seoImageAlts)
      .where(isNotNull(seoImageAlts.imageSrc))
      .orderBy(asc(seoImageAlts.imageSrc));
  }

  async getAllSeoImageAlts(): Promise<SeoImageAlt[]> {
    return db.select().from(seoImageAlts).orderBy(asc(seoImageAlts.imageKey));
  }

  async getSeoImageAltFile(imageSrc: string): Promise<SeoImageAlt | undefined> {
    const [result] = await db
      .select()
      .from(seoImageAlts)
      .where(eq(seoImageAlts.imageKey, `file:${imageSrc}`));
    return result;
  }

  async upsertSeoImageAltFile(
    imageSrc: string,
    altText: string | null,
    isDecorative: boolean
  ): Promise<SeoImageAlt> {
    const values = {
      imageKey: `file:${imageSrc}`,
      imageSrc,
      altText,
      isDecorative,
      updatedAt: new Date(),
    };
    const [result] = await db
      .insert(seoImageAlts)
      .values(values)
      .onConflictDoUpdate({ target: seoImageAlts.imageKey, set: values })
      .returning();
    return result;
  }

  async resolveSeoImageAltConflict(
    imageSrc: string,
    altText: string | null,
    isDecorative: boolean
  ): Promise<SeoImageAlt> {
    const now = new Date();
    const values = {
      imageKey: `file:${imageSrc}`,
      imageSrc,
      altText,
      isDecorative,
      needsReview: false,
      reviewedAt: now,
      updatedAt: now,
    };
    const [result] = await db
      .insert(seoImageAlts)
      .values(values)
      .onConflictDoUpdate({ target: seoImageAlts.imageKey, set: values })
      .returning();
    return result;
  }

  async deleteSeoImageAltFile(imageSrc: string): Promise<void> {
    await db.delete(seoImageAlts).where(eq(seoImageAlts.imageKey, `file:${imageSrc}`));
  }

  async getAllSeoRedirects(): Promise<SeoRedirect[]> {
    return db.select().from(seoRedirects).orderBy(asc(seoRedirects.source));
  }

  async getSeoRedirectById(id: string): Promise<SeoRedirect | undefined> {
    const [result] = await db.select().from(seoRedirects).where(eq(seoRedirects.id, id));
    return result;
  }

  async getSeoRedirectBySource(source: string): Promise<SeoRedirect | undefined> {
    const [result] = await db.select().from(seoRedirects).where(eq(seoRedirects.source, source));
    return result;
  }

  async createSeoRedirect(data: { source: string; destination: string; enabled: boolean }): Promise<SeoRedirect> {
    const [result] = await db.insert(seoRedirects).values(data).returning();
    return result;
  }

  async updateSeoRedirect(
    id: string,
    data: { source: string; destination: string; enabled: boolean }
  ): Promise<SeoRedirect> {
    const [result] = await db
      .update(seoRedirects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(seoRedirects.id, id))
      .returning();
    return result;
  }

  async deleteSeoRedirect(id: string): Promise<void> {
    await db.delete(seoRedirects).where(eq(seoRedirects.id, id));
  }

  async createSession(userId: string, token: string, expiresAt: Date): Promise<AdminSession> {
    const [result] = await db.insert(adminSessions).values({ userId, token, expiresAt }).returning();
    return result;
  }

  async getSessionByToken(token: string): Promise<AdminSession | undefined> {
    const [result] = await db.select().from(adminSessions).where(eq(adminSessions.token, token));
    if (result && result.expiresAt < new Date()) {
      await this.deleteSession(token);
      return undefined;
    }
    return result;
  }

  async deleteSession(token: string): Promise<void> {
    await db.delete(adminSessions).where(eq(adminSessions.token, token));
  }

  async cleanExpiredSessions(): Promise<void> {
    await db.delete(adminSessions).where(lt(adminSessions.expiresAt, sql`NOW()`));
  }
}

export const storage = new DatabaseStorage();
