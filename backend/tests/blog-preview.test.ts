import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { blogPreviewPath, previewStatusText } from "@/lib/blogPreview";

const file = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const now = new Date("2026-11-18T10:00:00Z");
const base = { status: "published", visibility: "public", publishedAt: new Date("2026-11-01T10:00:00Z"), trashedAt: null };

test("the preview address is the admin preview route for the article id", () => {
  assert.equal(blogPreviewPath(42), "/admin/preview/blog/42");
});

test("the preview banner says plainly whether the article is live", () => {
  assert.match(previewStatusText({ ...base, status: "draft", publishedAt: null }, now), /^Draft\. Not visible to visitors yet\./);
  assert.match(previewStatusText(base, now), /^Published and live\./);
  assert.match(previewStatusText({ ...base, status: "scheduled", publishedAt: new Date("2026-12-01T06:00:00Z") }, now), /^Scheduled for 1 Dec 2026, 10:00 AM \(Dubai time\)\. Not visible to visitors until then\./);
  assert.match(previewStatusText({ ...base, visibility: "password" }, now), /need the password/);
  assert.match(previewStatusText({ ...base, trashedAt: new Date() }, now), /^In the trash/);
});

test("the preview page is admin-only, never indexed, and renders the same article as the public page", () => {
  const page = file("app/admin/preview/blog/[id]/page.tsx");
  assert.match(page, /cookies\(\)\)\.get\("admin_token"\)/);
  assert.match(page, /getSessionByToken/);
  assert.match(page, /robots: \{ index: false, follow: false \}/);
  assert.match(page, /<BlogArticle post=\{safePost\} preview \/>/);
  assert.match(page, /passwordHash: _passwordHash/);
  assert.match(file("app/blog/[slug]/page.tsx"), /<BlogArticle post=\{post\} \/>/);
});

test("a preview leaves out search-engine data, the live page keeps it", () => {
  const article = file("components/blog/BlogArticle.tsx");
  assert.match(article, /!preview && <BreadcrumbJsonLd/);
  assert.match(article, /!preview && articleJson && <StructuredData/);
});

test("the article list and the editor open the preview in a new tab", () => {
  const manager = file("app/admin/BlogManager.tsx");
  assert.match(manager, /href=\{blogPreviewPath\(post\.id\)\} target="_blank" rel="noopener noreferrer"/);
  const editor = file("app/admin/BlogEditor.tsx");
  assert.match(editor, /href=\{blogPreviewPath\(post\.id\)\} target="_blank"/);
  assert.match(editor, /disabled title="Save the article as a draft first/);
});

test("the live-article link opens only for articles visitors can reach", async () => {
  const { blogLivePath, isOpenToVisitors } = await import("@/lib/blogPreview");
  const live = { status: "published", visibility: "public", publishedAt: "2026-11-01T10:00:00.000Z", trashedAt: null };
  assert.equal(blogLivePath("my-post"), "/blog/my-post");
  assert.equal(isOpenToVisitors(live, now), true);
  assert.equal(isOpenToVisitors({ ...live, visibility: "password" }, now), true);
  assert.equal(isOpenToVisitors({ ...live, status: "scheduled", publishedAt: "2026-12-01T10:00:00.000Z" }, now), false);
  assert.equal(isOpenToVisitors({ ...live, status: "scheduled", publishedAt: "2026-11-10T10:00:00.000Z" }, now), true);
  assert.equal(isOpenToVisitors({ ...live, status: "draft", publishedAt: null }, now), false);
  assert.equal(isOpenToVisitors({ ...live, visibility: "private" }, now), false);
  assert.equal(isOpenToVisitors({ ...live, trashedAt: "2026-11-02T10:00:00.000Z" }, now), false);
  assert.match(readFileSync(resolve(process.cwd(), "app/admin/BlogManager.tsx"), "utf8"), /href=\{blogLivePath\(post\.slug\)\} target="_blank" rel="noopener noreferrer"/);
});
