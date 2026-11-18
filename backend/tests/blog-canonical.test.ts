import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const page = readFileSync(resolve(process.cwd(), "app/blog/[slug]/page.tsx"), "utf8");

test("every blog article metadata sets its own canonical, never the layout's homepage default", () => {
  assert.match(page, /const blogPostPath = \(slug: string\) => `\/blog\/\$\{slug\}`/);
  // Both the normal article and the password-protected one declare it.
  const declared = page.match(/alternates: \{ canonical: blogPostPath\(post\.slug\) \}/g) ?? [];
  assert.equal(declared.length, 2);
  assert.equal((page.match(/url: blogPostPath\(post\.slug\)/g) ?? []).length, 2);
});

test("the layout default is the homepage, which is why a page that forgets its own canonical points there", () => {
  const layout = readFileSync(resolve(process.cwd(), "app/layout.tsx"), "utf8");
  assert.match(layout, /alternates: \{\s*canonical: "\/",?\s*\}/);
});
