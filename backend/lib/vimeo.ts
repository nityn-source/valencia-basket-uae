/**
 * Vimeo links (pure helpers, safe to import anywhere). Used for the camp film in
 * the Winter Camp hero; the link is pasted in Admin → Events → the event → "Camp page".
 */
export interface VimeoVideo {
  id: string;
  /** The privacy hash of an unlisted video (vimeo.com/<id>/<hash> or ?h=<hash>). */
  hash: string | null;
}

const HOSTS = new Set(["vimeo.com", "www.vimeo.com", "player.vimeo.com"]);

/** The video in a Vimeo link, or null for anything that isn't a Vimeo video link. */
export function parseVimeo(url: string | null | undefined): VimeoVideo | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" || !HOSTS.has(parsed.hostname.toLowerCase())) return null;
  const parts = parsed.pathname.split("/").filter(Boolean);
  // player.vimeo.com/video/<id>, vimeo.com/<id>, vimeo.com/<id>/<hash>, vimeo.com/channels/<name>/<id>
  const idIndex = parts.findIndex((part) => /^\d{5,}$/.test(part));
  if (idIndex === -1) return null;
  const next = parts[idIndex + 1];
  const hash = parsed.searchParams.get("h") || (next && /^[a-f0-9]{6,}$/i.test(next) ? next : null);
  return { id: parts[idIndex], hash: hash && /^[a-zA-Z0-9]+$/.test(hash) ? hash : null };
}

/** The address of Vimeo's own page for the video (used to ask Vimeo for its title and cover). */
export function vimeoPageUrl(video: VimeoVideo) {
  return `https://vimeo.com/${video.id}${video.hash ? `/${video.hash}` : ""}`;
}

/**
 * The player address. "loop" is the silent, controls-free autoplay used behind the
 * hero; "sound" is the full player opened when a visitor taps. Both ask Vimeo not to
 * track the visitor (dnt=1).
 */
export function vimeoPlayerSrc(video: VimeoVideo, mode: "loop" | "sound") {
  const query = new URLSearchParams();
  if (video.hash) query.set("h", video.hash);
  query.set("dnt", "1");
  query.set("playsinline", "1");
  query.set("title", "0");
  query.set("byline", "0");
  query.set("portrait", "0");
  query.set("autoplay", "1");
  if (mode === "loop") {
    query.set("muted", "1");
    query.set("loop", "1");
    query.set("controls", "0");
  }
  return `https://player.vimeo.com/video/${video.id}?${query.toString()}`;
}

/** "0:50" for 50 seconds, "1:05" for 65. */
export function formatDuration(seconds: number) {
  const total = Math.max(0, Math.round(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
