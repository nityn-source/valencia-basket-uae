import "server-only";
import { storage } from "@/lib/storage";
import type { VideoTestimonialRow } from "@shared/schema";
import { MAX_HOMEPAGE_VIDEOS, type VideoTestimonial } from "@/lib/videoTestimonials";

export function rowToVideoTestimonial(row: VideoTestimonialRow): VideoTestimonial {
  return {
    id: row.id,
    url: row.url,
    name: row.name,
    role: row.role,
    quote: row.quote,
    poster: row.poster,
    sortOrder: row.sortOrder,
    visible: row.visible,
  };
}

/** Visible video testimonials in admin order. A database error shows none instead of breaking the page. */
export async function getVideoTestimonials(): Promise<VideoTestimonial[]> {
  try {
    const rows = await storage.getVideoTestimonials();
    return rows.filter((row) => row.visible).slice(0, MAX_HOMEPAGE_VIDEOS).map(rowToVideoTestimonial);
  } catch (error) {
    console.error("[video-testimonials] failed to load:", error);
    return [];
  }
}
