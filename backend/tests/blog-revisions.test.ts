import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { articleBlocks, diffArticles, diffWords } from "@/lib/blogDiff";
import { COALESCE_MINUTES, MAX_REVISIONS, blogWordCount, planRevision, revisionFields, sameRevisionFields, type LatestRevision } from "@/lib/blogRevisions";

const file = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const base = revisionFields({ title: "Title", excerpt: "Excerpt", content: "<p>Hello world</p>" });
const edited = { ...base, content: "<p>Hello brave world</p>" };
const now = new Date("2026-11-18T12:00:00Z");
const latestOf = (fields = base, extra: Partial<LatestRevision> = {}): LatestRevision => ({ fields, reason: "update", savedBy: "Maros", createdAt: new Date("2026-11-18T11:00:00Z"), ...extra });

test("defaults: 50 versions kept, and saves within 10 minutes by the same editor share one", () => {
  assert.equal(MAX_REVISIONS, 50);
  assert.equal(COALESCE_MINUTES, 10);
});

test("blank optional fields count as the same as missing ones", () => {
  assert.deepEqual(revisionFields({ title: "T", excerpt: "  ", content: "c", featuredImageSrc: "", metaTitle: null }), { title: "T", excerpt: null, content: "c", featuredImageSrc: null, featuredImageAlt: null, metaTitle: null, metaDescription: null });
  assert.equal(sameRevisionFields(base, { ...base }), true);
  assert.equal(sameRevisionFields(base, edited), false);
});

test("a save that changes nothing in the restorable fields keeps nothing", () => {
  assert.deepEqual(planRevision({ before: base, after: { ...base }, latest: latestOf(), savedBy: "Maros", reason: "update", now }), { action: "skip" });
  assert.deepEqual(planRevision({ before: base, after: { ...base }, latest: undefined, savedBy: "Maros", reason: "update", now }), { action: "skip" });
});

test("the first change after the feature also keeps the article as it was before", () => {
  const plan = planRevision({ before: base, after: edited, latest: undefined, savedBy: "Maros", reason: "update", now });
  assert.deepEqual(plan, { action: "insert", addBaseline: true, baselineReason: "baseline" });
});

test("history that is out of step with the article gets the article's earlier state added", () => {
  const stale = latestOf({ ...base, title: "Some older title" });
  assert.equal(planRevision({ before: base, after: edited, latest: stale, savedBy: "Maros", reason: "update", now }).action, "insert");
  assert.equal((planRevision({ before: base, after: edited, latest: stale, savedBy: "Maros", reason: "update", now }) as { addBaseline: boolean }).addBaseline, true);
});

test("a later save by someone else, or after 10 minutes, is a new version", () => {
  const someoneElse = planRevision({ before: base, after: edited, latest: latestOf(base, { createdAt: new Date("2026-11-18T11:58:00Z") }), savedBy: "Martin", reason: "update", now });
  assert.deepEqual(someoneElse, { action: "insert", addBaseline: false, baselineReason: "baseline" });
  const late = planRevision({ before: base, after: edited, latest: latestOf(base, { createdAt: new Date("2026-11-18T11:49:00Z") }), savedBy: "Maros", reason: "update", now });
  assert.equal(late.action, "insert");
});

test("the same editor saving again within 10 minutes updates their latest version", () => {
  const plan = planRevision({ before: base, after: edited, latest: latestOf(base, { createdAt: new Date("2026-11-18T11:55:00Z") }), savedBy: "Maros", reason: "update", now });
  assert.equal(plan.action, "coalesce");
});

test("a restore is always its own version and never merged", () => {
  const plan = planRevision({ before: base, after: edited, latest: latestOf(base, { createdAt: new Date("2026-11-18T11:59:00Z") }), savedBy: "Maros", reason: "restore", now });
  assert.deepEqual(plan, { action: "insert", addBaseline: false, baselineReason: "before_restore" });
});

test("word counts ignore markup", () => {
  assert.equal(blogWordCount("<h2>One two</h2><p>three &amp; four</p>"), 4);
  assert.equal(blogWordCount(""), 0);
});

test("word diff marks only what changed, from the current text to the older version", () => {
  const parts = diffWords("Look for sessions with a clear focus", "Good sessions have a clear focus");
  assert.deepEqual(parts.filter((part) => part.type === "add").map((part) => part.text.trim()), ["Good", "have"]);
  assert.deepEqual(parts.filter((part) => part.type === "del").map((part) => part.text.trim()), ["Look for", "with"]);
  assert.equal(parts.map((part) => (part.type === "add" ? "" : part.text)).join(""), "Look for sessions with a clear focus");
  assert.deepEqual(diffWords("same", "same"), [{ type: "same", text: "same" }]);
});

test("articles are compared paragraph by paragraph; tags, entities and formatting don't count", () => {
  assert.deepEqual(articleBlocks("<h2>Intro &amp; aim</h2><p>One <strong>two</strong></p><p></p><ul><li>Item</li></ul>"), [
    { tag: "h2", text: "Intro & aim" },
    { tag: "p", text: "One two" },
    { tag: "li", text: "Item" },
  ]);
  const current = "<p>Alpha stays.</p><p>Beta is the old paragraph in the article now.</p><p>Gamma stays.</p>";
  const version = "<p>Alpha stays.</p><p>Beta was the old paragraph in the article then.</p><p>Gamma stays.</p><p>A paragraph only the version had.</p>";
  const diff = diffArticles(current, version);
  assert.equal(diff.comparable, true);
  assert.deepEqual(diff.blocks.map((block) => block.kind), ["same", "changed", "same", "added"]);
  assert.equal(diff.stats.changedBlocks, 2);
  assert.ok(diff.stats.addedWords >= 6);
});

test("two unrelated paragraphs show as one removed and one added, not as an edit", () => {
  const diff = diffArticles("<p>Completely different words appear here today.</p>", "<p>Nothing alike remains between these lines.</p>");
  assert.deepEqual(diff.blocks.map((block) => block.kind), ["removed", "added"]);
});

test("saving records history after the save commits and never makes the save fail", () => {
  const storage = file("lib/storage.ts");
  assert.match(storage, /await this\.recordBlogRevision\(id, before, revisionFields\(updated\), beforeUpdatedAt, context\)/);
  assert.match(storage, /private async recordBlogRevision[\s\S]*?try \{[\s\S]*?\} catch \(error\) \{\s*console\.error\("\[blog\] couldn't record/);
  assert.match(storage, /limit \$\{MAX_REVISIONS\}/);
});

test("the revision routes are admin-only, and restoring records who did it", () => {
  for (const path of ["app/api/admin/blog/[id]/revisions/route.ts", "app/api/admin/blog/[id]/revisions/[revisionId]/route.ts", "app/api/admin/blog/[id]/revisions/[revisionId]/restore/route.ts"]) {
    assert.match(file(path), /const authError = await requireAdmin\(request\);\s*if \(authError\) return authError;/, path);
  }
  assert.match(file("app/api/admin/blog/[id]/revisions/[revisionId]/restore/route.ts"), /restoreBlogRevision\(id, revisionId, await getAdminUsername\(request\)\)/);
  assert.match(file("app/api/admin/blog/[id]/route.ts"), /savedBy: await getAdminUsername\(request\)/);
});

test("a restore brings back only title, excerpt, text, image and SEO fields, not address, status, dates or taxonomy", () => {
  const storage = file("lib/storage.ts");
  const block = storage.slice(storage.indexOf("async restoreBlogRevision"), storage.indexOf("async deleteBlogPost"));
  for (const field of ["title", "excerpt", "content", "featuredImageSrc", "featuredImageAlt", "metaTitle", "metaDescription"]) assert.match(block, new RegExp(`${field}: revision\\.${field}`));
  for (const field of ["slug", "status", "publishedAt", "visibility", "categoryNames", "tagNames", "authorName"]) assert.doesNotMatch(block, new RegExp(`${field}:`));
});

test("the editor shows a Revisions panel only for saved articles and refreshes the text after a restore", () => {
  const editor = file("app/admin/BlogEditor.tsx");
  assert.match(editor, /\{post && \(\s*<Panel title="Revisions"/);
  assert.match(editor, /<RichEditor key=\{editorKey\}/);
  assert.match(editor, /setEditorKey\(\(value\) => value \+ 1\)/);
});

test("the migration only adds the new table", () => {
  const sql = file("migrations/0017_blog_post_revisions.sql");
  assert.match(sql, /^CREATE TABLE "blog_post_revisions"/);
  assert.doesNotMatch(sql, /DROP|ALTER TABLE "(?!blog_post_revisions)/);
});

test("a rewritten phrase shows as one removed chunk and one added chunk, not scattered words", () => {
  const parts = diffWords(
    "Look for sessions with a clear skill focus, repeated practice and feedback from the coach. Fundamentals come first.",
    "Good sessions have a clear skill focus, repeated practice and coaching that gives players feedback. Fundamentals come first.",
  );
  assert.deepEqual(parts.map((part) => `${part.type}:${part.text}`), [
    "del:Look for", "add:Good", "same: sessions ", "del:with", "add:have",
    "same: a clear skill focus, repeated practice and ", "del:feedback from the coach", "add:coaching that gives players feedback", "same:. Fundamentals come first.",
  ]);
});

test("punctuation doesn't hide a shared word: a removed subtitle is just the subtitle", () => {
  assert.deepEqual(diffWords("How to Choose in Dubai: A Guide for Parents", "How to Choose in Dubai").map((part) => `${part.type}:${part.text}`), [
    "same:How to Choose in Dubai", "del:: A Guide for Parents",
  ]);
});
