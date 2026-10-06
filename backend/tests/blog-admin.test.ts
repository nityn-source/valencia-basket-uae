import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { BLOG_CONTENT_MAX, blogPostInputSchema, countInlineImages, formatBlogValidationError, sanitizeBlogHtml } from "@/lib/blog";

const projectFile = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

const validPost = {
  title: "Approved academy article",
  slug: "approved-academy-article",
  excerpt: "A concise article summary.",
  content: "Article body content.",
  featuredImageSrc: null,
  featuredImageAlt: null,
  authorName: "Academy Team",
  status: "draft" as const,
  publishedAt: null,
  isFeatured: false,
  metaTitle: null,
  metaDescription: null,
  ogImage: null,
  focusKeyword: null,
  noIndex: false,
  visibility: "public" as const,
  password: null,
  lockModifiedDate: false,
  ogTitle: null,
  ogDescription: null,
  categoryNames: ["Academy"],
  tagNames: [],
};

test("blog post validation rejects unsafe slugs, images, and incomplete schedules", () => {
  assert.equal(blogPostInputSchema.safeParse(validPost).success, true);
  assert.equal(blogPostInputSchema.safeParse({ ...validPost, slug: "../unsafe" }).success, false);
  assert.equal(blogPostInputSchema.safeParse({ ...validPost, featuredImageSrc: "javascript:alert(1)", featuredImageAlt: "Bad" }).success, false);
  assert.equal(blogPostInputSchema.safeParse({ ...validPost, status: "scheduled" }).success, false);
  assert.equal(blogPostInputSchema.safeParse({ ...validPost, status: "scheduled", publishedAt: "2026-12-01T08:00:00.000Z" }).success, true);
});

test("rich blog HTML keeps approved formatting and removes executable content", () => {
  const safe = sanitizeBlogHtml('<h2 style="text-align:center">Title</h2><p><strong>Safe</strong> <a href="https://example.com">link</a></p><script>alert(1)</script><img src="x" onerror="alert(1)">');
  assert.match(safe, /<h2 style="text-align:center">Title<\/h2>/);
  assert.match(safe, /<strong>Safe<\/strong>/);
  assert.match(safe, /href="https:\/\/example.com"/);
  assert.doesNotMatch(safe, /script|onerror|alert\(1\)|src="x"/i);
});

test("blog admin and public routes use authenticated persisted content", () => {
  const adminList = projectFile("app/api/admin/blog/route.ts");
  const adminItem = projectFile("app/api/admin/blog/[id]/route.ts");
  const adminPage = projectFile("app/admin/page.tsx");
  const manager = projectFile("app/admin/BlogManager.tsx");
  const publicPage = projectFile("app/blog/page.tsx");
  const detailPage = projectFile("app/blog/[slug]/page.tsx");
  const unlockRoute = projectFile("app/api/blog/[slug]/unlock/route.ts");

  assert.match(adminList, /requireAdmin/);
  assert.match(adminItem, /requireAdmin/);
  assert.match(adminList, /createBlogPost/);
  assert.match(adminItem, /updateBlogPost/);
  assert.match(adminItem, /deleteBlogPost/);
  assert.match(adminPage, /tab-trigger-blog/);
  const editor = projectFile("app/admin/BlogEditor.tsx");
  const metaApi = projectFile("app/api/admin/blog/meta/route.ts");
  assert.match(manager, /BlogEditor/);
  assert.match(editor, /Add Media/);
  assert.match(editor, /Word count:/);
  assert.match(editor, /Edit Snippet/);
  assert.match(editor, /All Categories/);
  assert.match(editor, /Most Used/);
  assert.match(metaApi, /requireAdmin/);
  assert.match(adminList, /withoutPasswordHash/);
  assert.match(adminItem, /withoutPasswordHash/);
  assert.match(unlockRoute, /bcrypt\.compare/);
  assert.match(unlockRoute, /httpOnly:\s*true/);
  assert.match(detailPage, /verifyBlogAccessToken/);
  assert.match(detailPage, /PasswordForm/);
  assert.match(publicPage, /getPublishedBlogPosts/);
  assert.match(detailPage, /getBlogPostBySlug/);
  assert.doesNotMatch(detailPage, /dangerouslySetInnerHTML=\{\{ __html: post\.content/);
});
test("blog images keep only whitelisted size and alignment presets", () => {
  const safe = sanitizeBlogHtml(
    '<img src="https://cdn.example.com/a.jpg" alt="Court" data-size="medium" data-align="left" data-editor-selected="true">' +
    '<img src="https://cdn.example.com/b.jpg" data-size="huge" data-align="middle" style="width:900px" width="900">'
  );
  assert.match(safe, /<img src="https:\/\/cdn\.example\.com\/a\.jpg" alt="Court" data-size="medium" data-align="left">/);
  assert.doesNotMatch(safe, /data-editor-selected/, "the editor's selection marker must never be saved");
  assert.doesNotMatch(safe, /huge|middle|width/, "unknown presets and free-form sizing must be stripped");
});

test("pasted tables keep their structure but lose source widths, colours and borders", () => {
  const pasted = '<table style="width:600px;border:2px solid red" border="1" cellpadding="4" bgcolor="#ff0"><colgroup><col width="200"></colgroup>'
    + '<thead><tr><th scope="col" style="background:#123456">Academy</th><th colspan="2" class="x">Ages</th></tr></thead>'
    + '<tbody><tr><td rowspan="2" width="120" onclick="alert(1)">Valencia</td><td>4</td><td>18</td></tr></tbody></table>';
  const clean = sanitizeBlogHtml(pasted);
  assert.equal(clean, '<table><thead><tr><th scope="col">Academy</th><th colspan="2">Ages</th></tr></thead><tbody><tr><td rowspan="2">Valencia</td><td>4</td><td>18</td></tr></tbody></table>');
  assert.equal(sanitizeBlogHtml('<td colspan="9999" rowspan="x">a</td>'), "<td>a</td>", "only sensible spans are kept");
});

test("an over-long article gets a readable error that points at pasted images", () => {
  const huge = `<p>Intro</p><img src="data:image/png;base64,${"A".repeat(BLOG_CONTENT_MAX)}">`;
  const result = blogPostInputSchema.safeParse({ title: "Long post", slug: "long-post", content: huge, authorName: "Coach", status: "draft", categoryNames: ["News"] });
  assert.equal(result.success, false);
  const message = formatBlogValidationError(result.error);
  assert.match(message, /^This article is too long to save \([\d,]+ of 200,000 characters\)\./);
  assert.match(message, /1 pasted image stored inside the text/);
  assert.doesNotMatch(message, /too_big|"code"/, "no raw validation JSON");
  assert.equal(countInlineImages('<img src="https://x/a.png"><img alt="" src="data:image/jpeg;base64,AA">'), 1);
});

test("other validation errors name the field in plain words", () => {
  const result = blogPostInputSchema.safeParse({ title: "Ok title", slug: "Bad Slug!", content: "<p>x</p>", authorName: "Coach", status: "draft", categoryNames: ["News"] });
  assert.equal(result.success, false);
  assert.equal(formatBlogValidationError(result.error), "Permalink: Use lowercase letters, numbers, and hyphens");
});

test("empty headings become blank lines instead of blank H2s", () => {
  assert.equal(
    sanitizeBlogHtml('<h2><br></h2><h2>2. NBA Basketball School</h2><h3 style="text-align:center"> &nbsp;<span><b></b></span> </h3><p>Text</p>'),
    "<p><br></p><h2>2. NBA Basketball School</h2><p><br></p><p>Text</p>",
  );
  assert.equal(sanitizeBlogHtml("<h2><br>Real title</h2>"), "<h2><br>Real title</h2>", "headings with text are kept");
  assert.equal(sanitizeBlogHtml('<h2><img src="https://example.com/a.webp" alt="x"></h2>'), '<h2><img src="https://example.com/a.webp" alt="x"></h2>', "a heading holding an image is not touched");
});

test("headings 5 and 6 are kept", () => {
  assert.equal(sanitizeBlogHtml("<h5>Small heading</h5><h6>Smallest heading</h6>"), "<h5>Small heading</h5><h6>Smallest heading</h6>");
});

test("links open in a new tab only when asked, and new-tab links always get rel=noopener", () => {
  assert.equal(sanitizeBlogHtml('<a href="https://example.com" target="_blank">x</a>'), '<a href="https://example.com" target="_blank" rel="noopener noreferrer">x</a>');
  assert.equal(sanitizeBlogHtml('<a href="https://example.com" target="_blank" rel="opener">x</a>'), '<a href="https://example.com" target="_blank" rel="noopener noreferrer">x</a>');
  assert.equal(sanitizeBlogHtml('<a href="/programs" target="_self" rel="nofollow">x</a>'), '<a href="/programs" rel="nofollow">x</a>');
  assert.equal(sanitizeBlogHtml('<a href="https://partner.com" rel="sponsored" target="_blank">x</a>'), '<a href="https://partner.com" target="_blank" rel="sponsored noopener noreferrer">x</a>');
  assert.equal(sanitizeBlogHtml('<a href="/programs" target="evil">x</a>'), '<a href="/programs">x</a>');
});

test("nofollow and sponsored links keep their rel values, with or without a new tab", () => {
  assert.equal(sanitizeBlogHtml('<a href="https://doi.org/x" rel="nofollow" title="Source">x</a>'), '<a href="https://doi.org/x" rel="nofollow" title="Source">x</a>');
  assert.equal(sanitizeBlogHtml('<a href="https://shop.com" target="_blank" rel="nofollow sponsored noopener noreferrer">x</a>'), '<a href="https://shop.com" target="_blank" rel="nofollow sponsored noopener noreferrer">x</a>');
});
