import assert from "node:assert/strict";
import test from "node:test";
import { CONTENT_FIELDS } from "@/lib/content/pageContent";
import { PAGE_SEO_DEFAULTS } from "@/lib/seo/registry";
import { leadGender } from "@/lib/leadSource";

const girls = (key: string) => CONTENT_FIELDS.find((f) => f.key === key);

test("the girls' page has editable copy for every level, FAQ and banner", () => {
  for (const key of ["girls.hero.title", "girls.level4.button", "girls.faq8.a", "girls.form.button", "programs.girls.title", "girls.intro.image"]) {
    assert.ok(girls(key), `${key} should be editable in Page Content`);
  }
  assert.equal(girls("girls.hero.title")?.page, "Girls Programs");
});

test("the girls' page has its own SEO entry", () => {
  const page = PAGE_SEO_DEFAULTS.find((p) => p.path === "/programs/girls-basketball");
  assert.ok(page);
  assert.equal(page.canonical, "/programs/girls-basketball");
  assert.ok(page.description.length <= 160);
});

test("every lead from the girls' page is recorded as a girl without the form asking", () => {
  assert.equal(leadGender({ sourcePage: "programs-girls" }), "Girl");
  assert.equal(leadGender({ sourcePage: "home" }), "");
});
