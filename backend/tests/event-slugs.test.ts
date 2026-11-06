import assert from "node:assert/strict";
import test from "node:test";
import { renamedEventSlug } from "@/lib/eventSlugs";
import { EVENT_SEO } from "@/lib/seo/eventSeo";
import { WINTER_CAMP_EVENT } from "@/lib/content/winterCampDefaults";

test("the old winter camp address maps to the shorter one, and other slugs are left alone", () => {
  assert.equal(renamedEventSlug("winter-camp-2026"), "winter-camp");
  assert.equal(renamedEventSlug("winter-camp"), undefined);
  assert.equal(renamedEventSlug("summer-camp"), undefined);
  assert.equal(renamedEventSlug("constructor"), undefined, "inherited object keys are not slugs");
});

test("the shorter slug has its search title, and is what a new winter camp is created with", () => {
  assert.equal(WINTER_CAMP_EVENT.slug, "winter-camp");
  assert.ok(EVENT_SEO["winter-camp"]?.title.includes("Winter Camp"));
});
