import { z } from "zod";

const allowedHtmlTags = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "s", "h1", "h2", "h3", "h4", "h5", "h6",
  "blockquote", "ul", "ol", "li", "a", "span", "font", "img", "hr", "div", "iframe",
  // Tables keep their structure; widths, colours and borders from the source are dropped
  // (the site's own table style applies instead).
  "table", "caption", "thead", "tbody", "tfoot", "tr", "th", "td",
]);

const tableCellTags = new Set(["th", "td"]);

/** Longest article body that can be saved (characters of stored HTML). */
export const BLOG_CONTENT_MAX = 200_000;

// Only Instagram's own no-JS embed endpoint is ever allowed as an iframe src.
const instagramEmbedPattern = /^https:\/\/(?:www\.)?instagram\.com\/(?:p|reel|tv)\/[A-Za-z0-9_-]+\/embed(?:\/captioned)?\/?(?:\?[^\s"'<>]*)?$/i;

// A heading with no text: pressing Enter while "Heading 2" is on leaves <h2><br></h2>,
// which SEO tools report as a blank H2. Matched after sanitising, so only simple tags remain.
const emptyHeadingPattern = /<h([1-6])(?:\s[^>]*)?>(?:\s|&nbsp;|&#160;|<br>|<\/?(?:span|strong|b|em|i|u|s|font)(?:\s[^>]*)?>)*<\/h\1>/gi;

/** Empty headings become a plain blank line, so the spacing stays but no blank heading is left. */
export function replaceEmptyHeadings(html: string) {
  return html.replace(emptyHeadingPattern, "<p><br></p>");
}

export function sanitizeBlogHtml(input: string) {
  return tidyLists(replaceEmptyHeadings(sanitizeTags(instagramQuotesToEmbeds(input))));
}

// Instagram's "copy embed code" is a <blockquote> of placeholder boxes plus a script we never
// run, so a pasted post showed as a quote of links. It becomes the same iframe embed that the
// editor's "Embed Instagram" button makes. Only quotes carrying Instagram's own caption are touched.
const instagramQuotePattern = /<blockquote\b[^>]*>((?:(?!<\/?blockquote\b)[\s\S])*?)<\/blockquote\s*>/gi;

export function instagramQuotesToEmbeds(html: string) {
  return html.replace(instagramQuotePattern, (full, inner: string) => {
    if (!/View this post on Instagram|A post shared by/i.test(inner)) return full;
    const post = /https?:\/\/(?:www\.)?instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/i.exec(inner);
    if (!post) return full;
    return `<iframe src="https://www.instagram.com/${post[1].toLowerCase()}/${post[2]}/embed" width="400" height="480" frameborder="0" scrolling="no" allowtransparency="true"></iframe>`;
  });
}

// Pasted lists often carry their own typed bullet ("- Ages: 4 to 18"), which showed twice once
// lists got real bullets; empty bullets (left by Enter at the end of a list) are dropped.
const typedBulletPattern = /(<li\b[^>]*>(?:\s|<(?:p|span|strong|b|em|i|u|font)\b[^>]*>)*)(?:[-–•*]|&#8226;|&bull;)(?:\s|&nbsp;)+/gi;
const emptyListItemPattern = /<li\b[^>]*>(?:\s|&nbsp;|<br>|<\/?(?:p|span|strong|b|em|i|u|font)\b[^>]*>)*<\/li>/gi;
const trailingBlankLinePattern = /(?:<p>(?:\s|&nbsp;)*<br>(?:\s|&nbsp;)*<\/p>)+(\s*<\/li>)/gi;

function tidyLists(html: string) {
  return html.replace(typedBulletPattern, "$1").replace(trailingBlankLinePattern, "$1").replace(emptyListItemPattern, "");
}

function sanitizeTags(input: string) {
  let html = input
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|object|embed|form|textarea|button|svg|math|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<(script|style|object|embed|form|textarea|button|svg|math|template)\b[^>]*\/?>/gi, "");

  return html.replace(/<([a-z0-9]+)([^>]*)>/gi, (full, rawTag: string, rawAttributes: string) => {
    const tag = rawTag.toLowerCase();
    if (!allowedHtmlTags.has(tag)) return "";
    if (tag === "br" || tag === "hr") return `<${tag}>`;

    const attributes: string[] = [];
    const attributePattern = /([a-z:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/gi;
    let match: RegExpExecArray | null;
    while ((match = attributePattern.exec(rawAttributes))) {
      const name = match[1].toLowerCase();
      const value = match[2] ?? match[3] ?? match[4] ?? "";
      if (name.startsWith("on") || name === "id" || name === "class" || name === "srcset") continue;
      if (name === "href") {
        if (!/^(?:https?:\/\/|mailto:|\/|#)/i.test(value)) continue;
        attributes.push(`href="${value.replace(/"/g, "&quot;")}"`);
        continue;
      }
      if (name === "src") {
        if (tag === "iframe") {
          if (!instagramEmbedPattern.test(value)) continue;
        } else if (!/^(?:https:\/\/|\/|data:image\/(?:jpeg|png|webp|gif);base64,)/i.test(value)) continue;
        attributes.push(`src="${value.replace(/"/g, "&quot;")}"`);
        continue;
      }
      if (tag === "img" && name === "data-size") {
        if (/^(?:small|medium|large|full)$/.test(value)) attributes.push(`data-size="${value}"`);
        continue;
      }
      if (tag === "img" && name === "data-align") {
        if (/^(?:left|center|right)$/.test(value)) attributes.push(`data-align="${value}"`);
        continue;
      }
      if (tableCellTags.has(tag) && (name === "colspan" || name === "rowspan")) {
        if (/^[1-9][0-9]?$/.test(value)) attributes.push(`${name}="${value}"`);
        continue;
      }
      if (tag === "th" && name === "scope") {
        if (/^(?:row|col|rowgroup|colgroup)$/i.test(value)) attributes.push(`scope="${value.toLowerCase()}"`);
        continue;
      }
      if (tag === "iframe" && (name === "width" || name === "height")) {
        if (/^[0-9]{1,4}%?$/.test(value)) attributes.push(`${name}="${value}"`);
        continue;
      }
      if (tag === "iframe" && (name === "frameborder" || name === "scrolling" || name === "allowtransparency")) {
        if (/^[a-z0-9]+$/i.test(value)) attributes.push(`${name}="${value}"`);
        continue;
      }
      if (name === "target" || name === "rel") {
        // Links choose same tab or new tab; a new-tab link always gets noopener/noreferrer below.
        // rel keeps only the SEO hints an editor may set (nofollow, sponsored, ugc).
        if (tag === "a" && name === "target" && value === "_blank") attributes.push('target="_blank"');
        if (tag === "a" && name === "rel") {
          const hints = value.toLowerCase().split(/\s+/).filter((token) => /^(?:nofollow|sponsored|ugc)$/.test(token));
          if (hints.length) attributes.push(`rel="${hints.join(" ")}"`);
        }
        continue;
      }
      if (name === "alt" || name === "title") {
        attributes.push(`${name}="${value.replace(/"/g, "&quot;")}"`);
        continue;
      }
      if (name === "color" && /^(?:#[0-9a-f]{3,8}|[a-z]+)$/i.test(value)) {
        attributes.push(`color="${value}"`);
        continue;
      }
      if (name === "style") {
        const safeStyles = value
          .split(";")
          .map((style) => style.trim())
          .filter((style) => /^(?:color|text-align)\s*:\s*(?:#[0-9a-f]{3,8}|[a-z]+|left|center|right)\s*$/i.test(style));
        if (safeStyles.length) attributes.push(`style="${safeStyles.join("; ").replace(/"/g, "&quot;")}"`);
      }
    }
    if (tag === "iframe" && !attributes.some((attr) => attr.startsWith("src="))) return "";
    if (attributes.includes('target="_blank"')) {
      const relIndex = attributes.findIndex((attr) => attr.startsWith("rel="));
      const hints = relIndex >= 0 ? attributes.splice(relIndex, 1)[0].slice(5, -1).split(" ") : [];
      attributes.push(`rel="${[...hints, "noopener", "noreferrer"].join(" ")}"`);
    }
    return `<${tag}${attributes.length ? ` ${attributes.join(" ")}` : ""}>`;
  }).replace(/<\/([a-z0-9]+)\s*>/gi, (full, rawTag: string) => {
    const tag = rawTag.toLowerCase();
    return allowedHtmlTags.has(tag) ? `</${tag}>` : "";
  });
}

// A paragraph with no text, only spaces, <br>s and empty inline tags.
const blankParagraphPattern = /<p\b[^>]*>(?:\s|&nbsp;|&#160;|<br>|<\/?(?:span|strong|b|em|i|u|s|font)\b[^>]*>)*<\/p>/gi;

/**
 * For the live article only: older articles used empty lines for spacing, which doubled up
 * once paragraphs got their own spacing. The editor keeps them, so new lines can be typed in.
 */
export function withoutBlankParagraphs(html: string) {
  return html.replace(blankParagraphPattern, "");
}

export function sanitizeBlogContent(input: string) {
  return /<[a-z][\s\S]*>/i.test(input) ? sanitizeBlogHtml(input) : input;
}

export function blogPlainText(input: string) {
  return sanitizeBlogContent(input)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

const imageSource = z
  .string()
  .trim()
  .max(2_850_000, "Image is too large")
  .refine(
    (value) =>
      value === "" ||
      value.startsWith("/") ||
      value.startsWith("https://") ||
      /^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(value),
    "Use a site image path, HTTPS image URL, or uploaded image file"
  );

export const blogPostInputSchema = z.object({
  title: z.string().trim().min(3).max(160),
  slug: z.string().trim().min(3).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens"),
  excerpt: z.string().trim().max(320).nullable().optional(),
  content: z.string().trim().min(1, "Add article content").superRefine((value, context) => {
    if (value.length <= BLOG_CONTENT_MAX) return;
    const pastedImages = countInlineImages(value);
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        `This article is too long to save (${value.length.toLocaleString("en-US")} of ${BLOG_CONTENT_MAX.toLocaleString("en-US")} characters).` +
        (pastedImages
          ? ` It contains ${pastedImages} pasted image${pastedImages === 1 ? "" : "s"} stored inside the text. Re-add ${pastedImages === 1 ? "it" : "them"} with Add Media instead.`
          : " Try splitting it into two articles."),
    });
  }),
  featuredImageSrc: imageSource.nullable().optional(),
  featuredImageAlt: z.string().trim().max(160).nullable().optional(),
  authorName: z.string().trim().min(2).max(120),
  status: z.enum(["draft", "published", "scheduled"]),
  publishedAt: z.string().datetime({ offset: true }).nullable().optional(),
  isFeatured: z.boolean().default(false),
  metaTitle: z.string().trim().max(160).nullable().optional(),
  metaDescription: z.string().trim().max(320).nullable().optional(),
  ogTitle: z.string().trim().max(160).nullable().optional(),
  ogDescription: z.string().trim().max(320).nullable().optional(),
  ogImage: imageSource.nullable().optional(),
  focusKeyword: z.string().trim().max(100).nullable().optional(),
  noIndex: z.boolean().default(false),
  visibility: z.enum(["public", "private", "password"]).default("public"),
  password: z.string().min(8).max(120).optional().nullable(),
  lockModifiedDate: z.boolean().default(false),
  schemaEnabled: z.boolean().default(true),
  categoryNames: z.array(z.string().trim().min(1).max(80)).min(1, "Select at least one category").max(20),
  tagNames: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
}).superRefine((value, context) => {
  if (value.status === "scheduled" && !value.publishedAt) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["publishedAt"],
      message: "A scheduled post requires a publish date",
    });
  }
});

/** Images pasted into an article that were stored inside the text (data: URLs) instead of uploaded. */
export function countInlineImages(html: string) {
  return (html.match(/<img\b[^>]*\bsrc\s*=\s*["']?data:image\//gi) ?? []).length;
}

/**
 * One readable sentence for a failed save, instead of the raw validation dump
 * (e.g. the "too_big" JSON admins used to see).
 */
export function formatBlogValidationError(error: unknown): string {
  const issues = (error as { issues?: Array<{ message: string; path: Array<string | number> }> })?.issues;
  if (!Array.isArray(issues) || !issues.length) return error instanceof Error ? error.message : "Invalid blog post";
  const labels: Record<string, string> = { title: "Title", slug: "Permalink", excerpt: "Excerpt", content: "Article", featuredImageSrc: "Featured image", categoryNames: "Categories" };
  const { message, path } = issues[0];
  const field = String(path[0] ?? "");
  if (field === "content" || !labels[field] || message.startsWith(labels[field])) return message;
  return `${labels[field]}: ${message}`;
}

export function normalizeBlogPostInput(input: z.infer<typeof blogPostInputSchema>) {
  const featuredImageSrc = input.featuredImageSrc?.trim() || null;
  const featuredImageAlt = input.featuredImageAlt?.trim() || null;
  if (featuredImageSrc && !featuredImageAlt) {
    throw new Error("Featured image alt text is required when an image is selected");
  }

  return {
    ...input,
    excerpt: input.excerpt?.trim() || null,
    content: sanitizeBlogContent(input.content),
    featuredImageSrc,
    featuredImageAlt,
    publishedAt:
      input.status === "published" && !input.publishedAt
        ? new Date()
        : input.publishedAt
          ? new Date(input.publishedAt)
          : null,
    metaTitle: input.metaTitle?.trim() || null,
    metaDescription: input.metaDescription?.trim() || null,
    ogTitle: input.ogTitle?.trim() || null,
    ogDescription: input.ogDescription?.trim() || null,
    ogImage: input.ogImage?.trim() || null,
    focusKeyword: input.focusKeyword?.trim() || null,
    password: input.password?.trim() || null,
    categoryNames: [...new Set(input.categoryNames.map((name) => name.trim()).filter(Boolean))],
    tagNames: [...new Set(input.tagNames.map((name) => name.trim()).filter(Boolean))],
  };
}

export const DEFAULT_BLOG_AUTHOR = "Valencia Basket Academy UAE";

/** Quick edits from the article list: author and/or categories, nothing else. */
export const blogQuickEditSchema = z.object({
  authorName: z.string().trim().min(2).max(120).optional(),
  categoryNames: z.array(z.string().trim().min(1).max(80)).min(1, "Select at least one category").max(20).optional(),
}).refine((value) => value.authorName !== undefined || value.categoryNames !== undefined, "Nothing to update");

export function splitBlogNames(value: string) {
  return [...new Set(value.split(",").map((name) => name.trim()).filter(Boolean))];
}