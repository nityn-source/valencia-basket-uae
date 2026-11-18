import { blogPlainText } from "@/lib/blog";

/**
 * Blog article revision history (pure helpers, safe to import anywhere). The
 * versions live in the blog_post_revisions table; see lib/storage.ts.
 */

/** The latest this many versions of an article are kept. */
export const MAX_REVISIONS = 50;
/** Saves by the same editor within this many minutes share one version (autosaves, quick fixes). */
export const COALESCE_MINUTES = 10;

export type RevisionReason = "update" | "baseline" | "before_restore" | "restore";

/** The fields a version holds and a restore brings back. */
export interface RevisionFields {
  title: string;
  excerpt: string | null;
  content: string;
  featuredImageSrc: string | null;
  featuredImageAlt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
}

const blankToNull = (value: string | null | undefined) => (value && value.trim() ? value : null);

export function revisionFields(post: {
  title: string;
  excerpt?: string | null;
  content: string;
  featuredImageSrc?: string | null;
  featuredImageAlt?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
}): RevisionFields {
  return {
    title: post.title,
    excerpt: blankToNull(post.excerpt),
    content: post.content,
    featuredImageSrc: blankToNull(post.featuredImageSrc),
    featuredImageAlt: blankToNull(post.featuredImageAlt),
    metaTitle: blankToNull(post.metaTitle),
    metaDescription: blankToNull(post.metaDescription),
  };
}

export function sameRevisionFields(a: RevisionFields, b: RevisionFields) {
  return (
    a.title === b.title &&
    a.excerpt === b.excerpt &&
    a.content === b.content &&
    a.featuredImageSrc === b.featuredImageSrc &&
    a.featuredImageAlt === b.featuredImageAlt &&
    a.metaTitle === b.metaTitle &&
    a.metaDescription === b.metaDescription
  );
}

export function blogWordCount(html: string) {
  // Only things with a letter or digit in them are words ("&" or "–" on their own are not).
  return blogPlainText(html).split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
}

export interface LatestRevision {
  fields: RevisionFields;
  reason: RevisionReason;
  savedBy: string | null;
  createdAt: Date;
}

export type RevisionPlan =
  | { action: "skip" }
  | {
      action: "insert" | "coalesce";
      /** Keep the article as it was before this save, because history didn't hold it yet. */
      addBaseline: boolean;
      baselineReason: "baseline" | "before_restore";
    };

/**
 * What to do with the version history when an article is saved.
 * - Nothing changed in the restorable fields (a quick author/category change): nothing.
 * - History doesn't yet hold the article as it was before this save (first save after the
 *   feature, or the history is out of step): keep that state first.
 * - The same editor saving again within COALESCE_MINUTES: update their latest version in place.
 */
export function planRevision(input: {
  before: RevisionFields;
  after: RevisionFields;
  latest: LatestRevision | undefined;
  savedBy: string | null;
  reason: "update" | "restore";
  now?: Date;
}): RevisionPlan {
  const { before, after, latest, savedBy, reason } = input;
  if (sameRevisionFields(before, after)) return { action: "skip" };
  const baselineReason = reason === "restore" ? "before_restore" : "baseline";
  const addBaseline = !latest || !sameRevisionFields(latest.fields, before);
  if (addBaseline) return { action: "insert", addBaseline, baselineReason };
  const now = input.now ?? new Date();
  const recent = now.getTime() - latest.createdAt.getTime() < COALESCE_MINUTES * 60_000;
  if (reason === "update" && latest.reason === "update" && latest.savedBy === savedBy && recent) {
    return { action: "coalesce", addBaseline: false, baselineReason };
  }
  return { action: "insert", addBaseline: false, baselineReason };
}

export function revisionReasonLabel(reason: string) {
  switch (reason) {
    case "baseline": return "Before history began";
    case "before_restore": return "Saved before a restore";
    case "restore": return "Restored from an earlier version";
    default: return "";
  }
}
