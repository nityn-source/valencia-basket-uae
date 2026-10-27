/** Minimal types and loader for YouTube's IFrame Player API (https://developers.google.com/youtube/iframe_api_reference). */
export interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  mute(): void;
  destroy(): void;
}

export interface YTPlayerEvent {
  target: YTPlayer;
  data: number;
}

interface YTNamespace {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      host?: string;
      playerVars?: Record<string, string | number>;
      events?: { onReady?: (event: YTPlayerEvent) => void; onStateChange?: (event: YTPlayerEvent) => void };
    },
  ) => YTPlayer;
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

/** YT.Player state codes we care about. */
export const YT_PLAYING = 1;
export const YT_BUFFERING = 3;

let apiPromise: Promise<YTNamespace> | null = null;

/** Loads the API script once and resolves with the YT namespace. */
export function loadYouTubeApi(): Promise<YTNamespace> {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT) resolve(window.YT);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => {
      apiPromise = null;
      reject(new Error("YouTube player failed to load"));
    };
    document.head.appendChild(script);
  });
  return apiPromise;
}
