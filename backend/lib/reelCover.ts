import "server-only";
import { storeBlogImage } from "@/lib/r2";
import { reelId } from "@/lib/reels";

/**
 * Cover pictures for reels, taken from Instagram's public reel page (the picture
 * its link previews use) and saved to our own storage, because Instagram's
 * picture links stop working after a few days. This is not an official Instagram
 * feature, so it can stop working without notice: every failure is described in
 * words (FAILURE_TEXT) and recorded for the admin warning (reelCoverHealth.ts).
 */
export type CoverFailure = "blocked" | "login_wall" | "layout_changed" | "image_download" | "network" | "store" | "not_found" | "invalid_reel";

export type CoverResult = { ok: true; url: string } | { ok: false; reason: CoverFailure; detail: string };

/** What the admin is told for each failure. */
export const FAILURE_TEXT: Record<CoverFailure, string> = {
  blocked: "Instagram is refusing our requests (it may have flagged the server for too many).",
  login_wall: "Instagram is asking for a login instead of showing the reel page.",
  layout_changed: "Instagram changed its page, so the cover picture can't be found any more.",
  image_download: "Instagram's cover picture couldn't be downloaded.",
  network: "Couldn't reach Instagram (it may be down, or slow to answer).",
  store: "The cover picture was found but couldn't be saved to our image storage.",
  not_found: "That reel can't be seen publicly (deleted or private).",
  invalid_reel: "Not an Instagram reel link.",
};

/** Failures that say nothing about whether Instagram is letting us in. */
export const NOT_A_HEALTH_SIGNAL: readonly CoverFailure[] = ["not_found", "invalid_reel"];

const USER_AGENT = "ValenciaBasketAcademy-ReelCovers/1.0 (+https://valenciabasket.ae)";
const PAGE_TIMEOUT_MS = 10_000;
const IMAGE_TIMEOUT_MS = 10_000;
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const decodeEntities = (value: string) => value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x2F;/g, "/").replace(/&#39;/g, "'");

/** The picture the page declares for link previews (og:image), or null. */
export function extractOgImage(html: string): string | null {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    if (!/\bproperty=["']og:image["']/i.test(tag)) continue;
    const content = /\bcontent=["']([^"']+)["']/i.exec(tag)?.[1];
    if (content) return decodeEntities(content);
  }
  return null;
}

/** Only fetch pictures from Instagram's own image servers. */
export function isInstagramImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && /(^|\.)(cdninstagram\.com|fbcdn\.net)$/i.test(url.hostname);
  } catch {
    return false;
  }
}

interface Options {
  fetchImpl?: typeof fetch;
  store?: (body: Uint8Array, contentType: string) => Promise<string>;
  /** Only check that Instagram still shows a cover picture; download and save nothing. */
  probeOnly?: boolean;
}

const fail = (reason: CoverFailure, detail: string): CoverResult => ({ ok: false, reason, detail });

export async function fetchReelCover(reelUrl: string, options: Options = {}): Promise<CoverResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const store = options.store ?? (async (body, type) => (await storeBlogImage(body, type, "content")).url);
  const id = reelId(reelUrl);
  if (!id) return fail("invalid_reel", reelUrl);

  let html: string;
  try {
    const response = await fetchImpl(`https://www.instagram.com/reel/${id}/`, {
      headers: { "user-agent": USER_AGENT, accept: "text/html", "accept-language": "en" },
      redirect: "follow",
      signal: AbortSignal.timeout(PAGE_TIMEOUT_MS),
    });
    if (/\/accounts\/login/i.test(response.url)) return fail("login_wall", `redirected to ${response.url}`);
    if (response.status === 404) return fail("not_found", "HTTP 404");
    if (response.status === 401 || response.status === 403 || response.status === 429) return fail("blocked", `HTTP ${response.status}`);
    if (!response.ok) return fail("network", `HTTP ${response.status}`);
    html = await response.text();
  } catch (error) {
    return fail("network", error instanceof Error ? error.message : "request failed");
  }

  const imageUrl = extractOgImage(html);
  if (!imageUrl || !isInstagramImageUrl(imageUrl)) {
    return fail(/loginForm|\/accounts\/login/i.test(html) ? "login_wall" : "layout_changed", imageUrl ? "picture is not on Instagram's image servers" : "no og:image on the page");
  }
  if (options.probeOnly) return { ok: true, url: imageUrl };

  let body: Uint8Array;
  let contentType: string;
  try {
    const response = await fetchImpl(imageUrl, { headers: { "user-agent": USER_AGENT }, signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS) });
    contentType = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (!response.ok) return fail("image_download", `HTTP ${response.status}`);
    if (!IMAGE_TYPES.includes(contentType)) return fail("image_download", `unexpected type ${contentType || "none"}`);
    body = new Uint8Array(await response.arrayBuffer());
    if (body.byteLength === 0 || body.byteLength > MAX_IMAGE_BYTES) return fail("image_download", `bad size ${body.byteLength}`);
  } catch (error) {
    return fail("image_download", error instanceof Error ? error.message : "download failed");
  }

  try {
    return { ok: true, url: await store(body, contentType) };
  } catch (error) {
    return fail("store", error instanceof Error ? error.message : "save failed");
  }
}
