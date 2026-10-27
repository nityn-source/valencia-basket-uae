import { z } from "zod";
import { isLegacyImagePath } from "@/lib/content/legacyImages";

/**
 * Instagram reels (pure helpers, safe to import anywhere). The live list is in
 * the reel_items table, edited in Admin → Page Content → Instagram reels; see
 * lib/content/reelsStore.ts for loading it.
 */
export const INSTAGRAM_URL = "https://www.instagram.com/valenciabasketuae/";

/** Where a reel can appear: the homepage or one program page. */
export const REEL_TARGETS = [
  { id: "homepage", label: "Homepage" },
  { id: "future-ballers", label: "Future Ballers page" },
  { id: "mini-basket", label: "Mini Basket page" },
  { id: "youth-academy", label: "Youth Academy page" },
  { id: "private-training", label: "Private Training page" },
] as const;

export type ReelTarget = (typeof REEL_TARGETS)[number]["id"];
export const REEL_TARGET_IDS = REEL_TARGETS.map((target) => target.id) as [ReelTarget, ...ReelTarget[]];
export const REEL_LIMITS = { caption: 120, url: 300 } as const;
/** The most reels shown in the homepage row. */
export const MAX_HOMEPAGE_REELS = 8;

export interface Reel {
  id?: number;
  url: string;
  caption: string;
  target: ReelTarget;
  poster?: string | null;
  sortOrder?: number;
  visible?: boolean;
}

/** The reel's short code from an Instagram /reel/, /reels/ or /p/ link. */
export function reelId(url: string): string | null {
  return url.match(/^https?:\/\/(?:www\.)?instagram\.com\/(?:reels?|p)\/([A-Za-z0-9_-]+)/i)?.[1] ?? null;
}

export function isPlaceholderReel(reel: Pick<Reel, "url">) {
  return /REPLACE_ME/.test(reel.url);
}

export function embedSrc(url: string): string | null {
  const id = reelId(url);
  return id ? `https://www.instagram.com/reel/${id}/embed/` : null;
}

/** What the admin sends when creating or editing a reel. */
export const reelInputSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Paste the reel's Instagram link")
    .max(REEL_LIMITS.url)
    .refine((value) => reelId(value) !== null, "That doesn't look like an Instagram reel link (instagram.com/reel/…)"),
  caption: z.string().trim().max(REEL_LIMITS.caption).default(""),
  target: z.enum(REEL_TARGET_IDS),
  poster: z
    .string()
    .trim()
    .max(1000)
    .refine((value) => value === "" || /^https:\/\//i.test(value) || isLegacyImagePath(value), "Cover image must be an uploaded image (HTTPS link)")
    .default(""),
  visible: z.boolean(),
});

export type ReelInput = z.infer<typeof reelInputSchema>;
