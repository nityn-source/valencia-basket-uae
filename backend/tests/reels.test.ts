import assert from "node:assert/strict";
import test from "node:test";
import { SAMPLE_REELS } from "@/data/reels";
import { REEL_TARGETS, embedSrc, isPlaceholderReel, reelId, reelInputSchema } from "@/lib/reels";
import { getReels } from "@/lib/content/reelsStore";
import { storage } from "@/lib/storage";

test("reel ids are read from reel, reels and post links", () => {
  assert.equal(reelId("https://www.instagram.com/reel/Cabc_123-x/"), "Cabc_123-x");
  assert.equal(reelId("https://instagram.com/reels/Cabc123/?igsh=1"), "Cabc123");
  assert.equal(reelId("https://www.instagram.com/p/Cabc123/"), "Cabc123");
  assert.equal(reelId("https://example.com/reel/Cabc123/"), null);
  assert.equal(reelId("https://evil.example/?u=https://www.instagram.com/reel/Cabc123/"), null);
  assert.equal(embedSrc("https://www.instagram.com/reel/Cabc123/"), "https://www.instagram.com/reel/Cabc123/embed/");
});

test("reel form: needs a real reel link, caption is optional, checks the cover image", () => {
  const ok = { url: "https://www.instagram.com/reel/Cabc123/", caption: "First session", target: "homepage", poster: "", visible: true };
  assert.ok(reelInputSchema.safeParse(ok).success);
  assert.ok(!reelInputSchema.safeParse({ ...ok, url: "https://www.instagram.com/valenciabasketuae/" }).success, "a profile link is not a reel");
  assert.ok(!reelInputSchema.safeParse({ ...ok, url: "" }).success);
  assert.ok(reelInputSchema.safeParse({ ...ok, caption: "  " }).success, "caption is optional");
  assert.equal(reelInputSchema.parse({ ...ok, caption: undefined }).caption, "");
  assert.ok(!reelInputSchema.safeParse({ ...ok, target: "contact" }).success);
  assert.ok(!reelInputSchema.safeParse({ ...ok, poster: "http://insecure.example/a.jpg" }).success);
  assert.ok(reelInputSchema.safeParse({ ...ok, poster: "https://cdn.example.com/a.jpg" }).success);
});

test("sample reels are valid, placeholder-marked, and for a known place", () => {
  const targets: string[] = REEL_TARGETS.map((target) => target.id);
  for (const reel of SAMPLE_REELS) {
    assert.ok(reelId(reel.url), `bad sample link ${reel.url}`);
    assert.ok(isPlaceholderReel(reel));
    assert.ok(targets.includes(reel.target));
  }
});

test("site reels: only visible ones for the place, in admin order; samples only on dev with an empty table", async () => {
  const env = process.env as Record<string, string | undefined>;
  const originalEnv = env.NODE_ENV;
  const original = storage.getReelItems;
  const row = (id: number, target: string, visible: boolean) =>
    ({ id, url: `https://www.instagram.com/reel/R${id}/`, caption: `Reel ${id}`, target, poster: null, sortOrder: id, visible, createdAt: new Date(), updatedAt: new Date() });
  try {
    storage.getReelItems = (async () => [row(1, "homepage", true), row(2, "homepage", false), row(3, "mini-basket", true), row(4, "homepage", true)]) as typeof storage.getReelItems;
    assert.deepEqual((await getReels("homepage")).map((reel) => reel.id), [1, 4]);
    assert.deepEqual((await getReels("mini-basket")).map((reel) => reel.id), [3]);
    assert.deepEqual(await getReels("future-ballers"), []);

    storage.getReelItems = (async () => []) as typeof storage.getReelItems;
    env.NODE_ENV = "development";
    assert.ok((await getReels("homepage")).length > 0, "dev shows sample reels while the table is empty");
    env.NODE_ENV = "production";
    assert.deepEqual(await getReels("homepage"), [], "production never shows samples");

    storage.getReelItems = (async () => { throw new Error("db down"); }) as typeof storage.getReelItems;
    assert.deepEqual(await getReels("homepage"), [], "a database error shows no reels instead of breaking the page");
  } finally {
    storage.getReelItems = original;
    env.NODE_ENV = originalEnv;
  }
});
