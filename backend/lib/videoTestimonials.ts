import { z } from "zod";
import { isLegacyImagePath } from "@/lib/content/legacyImages";

/**
 * Video testimonials (pure helpers, safe to import anywhere). The live list is in
 * the video_testimonials table, edited in Admin → Page Content → Video
 * testimonials; see lib/content/videoTestimonialsStore.ts for loading it.
 *
 * Videos are either unlisted YouTube videos (the usual way: upload to YouTube as
 * Unlisted and paste the link) or Google Drive files shared as "Anyone with the
 * link can view".
 */
export const VIDEO_LIMITS = { name: 80, role: 80, quote: 160, url: 300 } as const;
/** The most videos shown in the homepage row. */
export const MAX_HOMEPAGE_VIDEOS = 8;

export interface VideoTestimonial {
  id?: number;
  url: string;
  name: string;
  role: string;
  quote: string;
  poster?: string | null;
  sortOrder?: number;
  visible?: boolean;
}

/** The file id in a Google Drive share link, or null for anything else. */
export function driveFileId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" || parsed.hostname !== "drive.google.com") return null;
  const id = /\/file\/(?:u\/\d+\/)?d\/([A-Za-z0-9_-]{15,})/.exec(parsed.pathname)?.[1] ?? parsed.searchParams.get("id");
  return id && /^[A-Za-z0-9_-]{15,}$/.test(id) ? id : null;
}

export const driveEmbedSrc = (id: string) => `https://drive.google.com/file/d/${id}/preview`;
export const driveWatchUrl = (id: string) => `https://drive.google.com/file/d/${id}/view`;
/** Drive's own still frame for a shared video, used as the cover when none is uploaded. */
export const driveThumbnail = (id: string) => `https://drive.google.com/thumbnail?id=${id}&sz=w800`;

export interface VideoSource {
  kind: "youtube" | "drive";
  id: string;
  /** The player to show inside the page. */
  embedSrc: string;
  /** The video's own page, for the admin's "Open" link. */
  watchUrl: string;
  /** A still frame to use as the cover when none is uploaded. */
  thumbnail: string;
}

/** The YouTube video id in a watch, share, shorts, live or embed link, or null for anything else. */
export function youtubeVideoId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") return null;
  const host = parsed.hostname.replace(/^(www|m)\./, "");
  let id: string | null = null;
  if (host === "youtu.be") id = parsed.pathname.split("/")[1] ?? null;
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (parsed.pathname === "/watch") id = parsed.searchParams.get("v");
    else id = /^\/(?:shorts|live|embed|v)\/([^/]+)/.exec(parsed.pathname)?.[1] ?? null;
  }
  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
}

/** Where a pasted link points (YouTube or Google Drive), or null when it is neither. */
export function videoSource(url: string): VideoSource | null {
  const youtube = youtubeVideoId(url);
  if (youtube) {
    return {
      kind: "youtube",
      id: youtube,
      embedSrc: `https://www.youtube-nocookie.com/embed/${youtube}?autoplay=1&rel=0&modestbranding=1&playsinline=1`,
      watchUrl: `https://www.youtube.com/watch?v=${youtube}`,
      thumbnail: `https://i.ytimg.com/vi/${youtube}/hqdefault.jpg`,
    };
  }
  const drive = driveFileId(url);
  if (drive) return { kind: "drive", id: drive, embedSrc: driveEmbedSrc(drive), watchUrl: driveWatchUrl(drive), thumbnail: driveThumbnail(drive) };
  return null;
}

/** What the admin sends when creating or editing a video testimonial. */
export const videoInputSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Paste the video's YouTube or Google Drive link")
    .max(VIDEO_LIMITS.url)
    .refine((value) => videoSource(value) !== null, "That doesn't look like a YouTube or Google Drive video link"),
  name: z.string().trim().min(1, "Name is required").max(VIDEO_LIMITS.name),
  role: z.string().trim().max(VIDEO_LIMITS.role).default(""),
  quote: z.string().trim().max(VIDEO_LIMITS.quote).default(""),
  poster: z
    .string()
    .trim()
    .max(1000)
    .refine((value) => value === "" || /^https:\/\//i.test(value) || isLegacyImagePath(value), "Cover image must be an uploaded image (HTTPS link)")
    .default(""),
  visible: z.boolean(),
});

export type VideoInput = z.infer<typeof videoInputSchema>;
