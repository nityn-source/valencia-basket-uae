/** Admin preview of a blog article (pure helpers, safe to import anywhere). */

export function blogPreviewPath(id: number) {
  return `/admin/preview/blog/${id}`;
}

/** What the banner on a preview says about the article's current state. */
export function previewStatusText(post: {
  status: string;
  visibility: string;
  publishedAt: Date | null;
  trashedAt: Date | null;
}, now = new Date()) {
  if (post.trashedAt) return "In the trash. Not visible to visitors.";
  const where = post.visibility === "password" ? " Visitors will need the password." : post.visibility === "private" ? " Marked private, so visitors cannot open it." : "";
  if (post.status === "draft") return `Draft. Not visible to visitors yet.${where}`;
  if (post.publishedAt && post.publishedAt > now) {
    const when = post.publishedAt.toLocaleString("en-AE", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dubai" });
    return `Scheduled for ${when} (Dubai time). Not visible to visitors until then.${where}`;
  }
  return `Published and live.${where}`;
}

/** The public address of an article, as visitors open it. */
export function blogLivePath(slug: string) {
  return `/blog/${slug}`;
}

/**
 * Whether visitors can open the article right now: published or scheduled with a
 * date that has passed, not in the trash, and not private. (A password-protected
 * article counts: visitors reach its password page.) Mirrors the public page's rule.
 */
export function isOpenToVisitors(post: {
  status: string;
  visibility: string;
  publishedAt: Date | string | null;
  trashedAt?: Date | string | null;
}, now = new Date()) {
  if (post.trashedAt || post.visibility === "private") return false;
  if (post.status !== "published" && post.status !== "scheduled") return false;
  return !!post.publishedAt && new Date(post.publishedAt) <= now;
}

/** The preview address of one earlier saved version of an article. */
export function blogRevisionPreviewPath(postId: number, revisionId: number) {
  return `${blogPreviewPath(postId)}?revision=${revisionId}`;
}

/** What the banner says when previewing an earlier version. */
export function revisionBannerText(revision: { createdAt: Date; savedBy: string | null }) {
  const when = revision.createdAt.toLocaleString("en-AE", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dubai" });
  return `Earlier version saved ${when} (Dubai time)${revision.savedBy ? ` by ${revision.savedBy}` : ""}. Visitors see the current version, not this one.`;
}
