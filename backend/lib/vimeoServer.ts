import "server-only";
import { vimeoPageUrl, type VimeoVideo } from "@/lib/vimeo";

export interface VimeoInfo {
  title: string;
  thumbnail: string;
  width: number;
  height: number;
  duration: number;
}

/**
 * The cover picture, shape and length of a Vimeo video, from Vimeo's public oEmbed
 * page. Cached for a day. Returns null when Vimeo can't be reached or the video isn't
 * embeddable, and the page then simply shows the film without a cover.
 */
export async function getVimeoInfo(video: VimeoVideo): Promise<VimeoInfo | null> {
  try {
    const endpoint = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(vimeoPageUrl(video))}&width=720`;
    const response = await fetch(endpoint, { next: { revalidate: 86_400 }, signal: AbortSignal.timeout(3000) });
    if (!response.ok) return null;
    const data = (await response.json()) as Partial<VimeoInfo> & { thumbnail_url?: string };
    if (!data.thumbnail_url || !/^https:\/\/i\.vimeocdn\.com\//.test(data.thumbnail_url)) return null;
    return {
      title: String(data.title ?? ""),
      thumbnail: data.thumbnail_url,
      width: Number(data.width) || 9,
      height: Number(data.height) || 16,
      duration: Number(data.duration) || 0,
    };
  } catch {
    return null;
  }
}
