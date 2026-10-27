import assert from "node:assert/strict";
import test from "node:test";
import { extractOgImage, fetchReelCover, isInstagramImageUrl } from "@/lib/reelCover";
import { EMPTY_HEALTH, nextHealth } from "@/lib/content/reelCoverHealth";

const REEL = "https://www.instagram.com/reel/DeOYWdMO7OV/?utm_source=x";
const IMAGE = "https://scontent.cdninstagram.com/v/t51/cover.jpg?stp=a&amp;_nc_cat=105";

const page = (extra = "") => `<html><head><meta property="og:title" content="x" />${extra}</head></html>`;
const html = (body: string, init: { status?: number; url?: string } = {}) => {
  const response = new Response(body, { status: init.status ?? 200, headers: { "content-type": "text/html" } });
  if (init.url) Object.defineProperty(response, "url", { value: init.url });
  return response;
};
const jpeg = () => new Response(new Uint8Array([1, 2, 3, 4]), { status: 200, headers: { "content-type": "image/jpeg" } });
const store = async () => "https://cdn.example.com/blog/cover.jpg";

test("the cover picture is read from og:image, with HTML entities decoded", () => {
  assert.equal(extractOgImage(page(`<meta property="og:image" content="${IMAGE}" />`)), IMAGE.replace(/&amp;/g, "&"));
  assert.equal(extractOgImage(page(`<meta content="${IMAGE}" property="og:image">`)), IMAGE.replace(/&amp;/g, "&"));
  assert.equal(extractOgImage(page()), null);
});

test("only Instagram's own image servers are fetched", () => {
  assert.ok(isInstagramImageUrl("https://scontent.cdninstagram.com/v/a.jpg"));
  assert.ok(isInstagramImageUrl("https://scontent-dxb1-1.xx.fbcdn.net/v/a.jpg"));
  assert.ok(!isInstagramImageUrl("http://scontent.cdninstagram.com/v/a.jpg"), "https only");
  assert.ok(!isInstagramImageUrl("https://cdninstagram.com.evil.example/a.jpg"));
  assert.ok(!isInstagramImageUrl("https://169.254.169.254/latest/meta-data"));
});

test("a reel's cover is downloaded and saved", async () => {
  const fetchImpl = (async (url: string) => (String(url).includes("instagram.com/reel/") ? html(page(`<meta property="og:image" content="${IMAGE}" />`)) : jpeg())) as unknown as typeof fetch;
  const result = await fetchReelCover(REEL, { fetchImpl, store });
  assert.deepEqual(result, { ok: true, url: "https://cdn.example.com/blog/cover.jpg" });
});

test("each way Instagram can stop us is reported as its own reason", async () => {
  const withPage = (response: Response) => ({ fetchImpl: (async () => response) as unknown as typeof fetch, store });
  assert.equal((await fetchReelCover("https://example.com/x", { store })).ok, false);
  const reason = async (response: Response) => {
    const result = await fetchReelCover(REEL, withPage(response));
    return result.ok ? "ok" : result.reason;
  };
  assert.equal(await reason(html("", { status: 429 })), "blocked");
  assert.equal(await reason(html("", { status: 403 })), "blocked");
  assert.equal(await reason(html("", { status: 404 })), "not_found");
  assert.equal(await reason(html("", { status: 500 })), "network");
  assert.equal(await reason(html(page(), { url: "https://www.instagram.com/accounts/login/?next=/reel/x/" })), "login_wall");
  assert.equal(await reason(html(page("<form id=\"loginForm\"></form>"))), "login_wall");
  assert.equal(await reason(html(page())), "layout_changed");
  assert.equal(await reason(html(page(`<meta property="og:image" content="https://evil.example/a.jpg" />`))), "layout_changed");

  const throwing = (async () => { throw new Error("socket hang up"); }) as unknown as typeof fetch;
  assert.equal((await fetchReelCover(REEL, { fetchImpl: throwing, store })).ok, false);

  const badImage = (async (url: string) => (String(url).includes("instagram.com/reel/") ? html(page(`<meta property="og:image" content="${IMAGE}" />`)) : new Response("<html>", { headers: { "content-type": "text/html" } }))) as unknown as typeof fetch;
  const bad = await fetchReelCover(REEL, { fetchImpl: badImage, store });
  assert.equal(bad.ok ? "ok" : bad.reason, "image_download");

  const goodPage = (async (url: string) => (String(url).includes("instagram.com/reel/") ? html(page(`<meta property="og:image" content="${IMAGE}" />`)) : jpeg())) as unknown as typeof fetch;
  const stored = await fetchReelCover(REEL, { fetchImpl: goodPage, store: async () => { throw new Error("R2 down"); } });
  assert.equal(stored.ok ? "ok" : stored.reason, "store");
});

test("a probe only checks the page and saves nothing", async () => {
  let downloads = 0;
  const fetchImpl = (async (url: string) => {
    if (String(url).includes("instagram.com/reel/")) return html(page(`<meta property="og:image" content="${IMAGE}" />`));
    downloads++;
    return jpeg();
  }) as unknown as typeof fetch;
  assert.equal((await fetchReelCover(REEL, { fetchImpl, store, probeOnly: true })).ok, true);
  assert.equal(downloads, 0);
});

test("the admin warning turns on after a failure, counts, and clears on the next success", () => {
  const t1 = new Date("2026-10-27T10:00:00Z");
  const t2 = new Date("2026-10-28T10:00:00Z");
  const t3 = new Date("2026-10-29T10:00:00Z");
  const failed = nextHealth(EMPTY_HEALTH, { ok: false, reason: "blocked", detail: "HTTP 429" }, t1);
  assert.equal(failed.state, "failing");
  assert.equal(failed.failures, 1);
  assert.match(failed.message ?? "", /refusing our requests/);
  assert.match(failed.message ?? "", /HTTP 429/);

  const again = nextHealth(failed, { ok: false, reason: "login_wall", detail: "x" }, t2);
  assert.equal(again.failures, 2);
  assert.equal(again.failingSince, t1.toISOString(), "keeps the time it first broke");
  assert.equal(again.reason, "login_wall");

  const ignored = nextHealth(again, { ok: false, reason: "not_found", detail: "HTTP 404" }, t3);
  assert.equal(ignored, again, "a private or deleted reel says nothing about Instagram's access");

  const fixed = nextHealth(again, { ok: true, url: "u" }, t3);
  assert.equal(fixed.state, "ok");
  assert.equal(fixed.failures, 0);
  assert.equal(fixed.failingSince, null);
  assert.equal(fixed.lastSuccessAt, t3.toISOString());
});
