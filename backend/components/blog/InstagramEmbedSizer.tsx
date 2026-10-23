"use client";

import { useEffect } from "react";

/**
 * Instagram's embed page tells its parent how tall it needs to be (a "MEASURE"
 * message). A fixed iframe height squeezes the embed and puts its "View more on
 * Instagram" bar over the video, so this gives each embed in a blog post the
 * height Instagram asks for. Only messages from instagram.com, from an iframe
 * inside the article, are used.
 */
export function InstagramEmbedSizer() {
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      let host = "";
      try {
        host = new URL(event.origin).hostname;
      } catch {
        return;
      }
      if (host !== "instagram.com" && host !== "www.instagram.com") return;
      let data: unknown = event.data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }
      const message = data as { type?: string; details?: { height?: number } } | null;
      const height = message?.type === "MEASURE" ? message.details?.height : undefined;
      if (typeof height !== "number" || !Number.isFinite(height) || height < 100 || height > 2000) return;
      const frame = Array.from(document.querySelectorAll<HTMLIFrameElement>(".blog-content iframe")).find((candidate) => candidate.contentWindow === event.source);
      if (frame) frame.style.height = `${Math.ceil(height)}px`;
    };
    window.addEventListener("message", onMessage);
    // Embeds that finished loading before this ran have already sent their size
    // once, so reload any that haven't been sized yet to hear it again.
    for (const frame of document.querySelectorAll<HTMLIFrameElement>(".blog-content iframe")) {
      if (!frame.style.height && frame.src) frame.src = frame.src;
    }
    return () => window.removeEventListener("message", onMessage);
  }, []);
  return null;
}
