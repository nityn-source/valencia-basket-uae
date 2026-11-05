"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal, preconnect } from "react-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play, X } from "lucide-react";
import { YT_BUFFERING, YT_ENDED, YT_PLAYING, loadYouTubeApi, type YTPlayer } from "@/lib/youtubeApi";
import { videoSource, type VideoTestimonial } from "@/lib/videoTestimonials";

const GAP = 20;

/**
 * A YouTube video that starts on the first tap. The player loads quietly behind
 * the cover once the card is near the screen; the tap then calls play directly
 * (a freshly created embed would otherwise show YouTube's own start button and
 * need a second tap). If the browser refuses to start with sound, it starts muted.
 */
function YouTubeFrame({ id, title, active, cover, onTap, className = "aspect-[9/16] rounded-xl bg-[#2b251e]", children }: { id: string; title: string; active: boolean; cover: ReactNode; onTap: () => void; className?: string; children?: ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const readyRef = useRef(false);
  const stateRef = useRef(-1);
  const wantPlayRef = useRef(false);
  const [near, setNear] = useState(false);
  const [covered, setCovered] = useState(true);

  // Start loading when the card gets close to the screen.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const play = useCallback(() => {
    const player = playerRef.current;
    if (!player || !readyRef.current) return;
    player.playVideo();
    // Browsers may block sound-on autoplay; muted playback is always allowed.
    window.setTimeout(() => {
      if (stateRef.current !== YT_PLAYING && stateRef.current !== YT_BUFFERING && wantPlayRef.current) {
        player.mute();
        player.playVideo();
      }
    }, 700);
  }, []);

  useEffect(() => {
    if (!near) return;
    const host = wrapRef.current?.querySelector<HTMLElement>("[data-yt-host]");
    if (!host) return;
    let cancelled = false;
    const mount = document.createElement("div");
    host.appendChild(mount);
    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;
        playerRef.current = new YT.Player(mount, {
          videoId: id,
          host: "https://www.youtube-nocookie.com",
          playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
          events: {
            onReady: () => {
              readyRef.current = true;
              if (wantPlayRef.current) play();
            },
            onStateChange: (event) => {
              stateRef.current = event.data;
              if (event.data === YT_PLAYING || event.data === YT_BUFFERING) setCovered(false);
            },
          },
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
      readyRef.current = false;
    };
  }, [near, id, play]);

  // Tapped: play now, and drop the cover after a moment even if playback hasn't begun (so YouTube's own controls can be used).
  useEffect(() => {
    if (!active) {
      if (wantPlayRef.current) playerRef.current?.pauseVideo();
      wantPlayRef.current = false;
      return;
    }
    wantPlayRef.current = true;
    play();
    const timer = window.setTimeout(() => setCovered(false), 2500);
    return () => window.clearTimeout(timer);
  }, [active, play]);

  return (
    <div ref={wrapRef} className={`relative overflow-hidden ${className}`}>
      <div data-yt-host className="absolute inset-0 [&_iframe]:h-full [&_iframe]:w-full" title={title} />
      {covered && (
        <button type="button" onClick={onTap} aria-label={`Play video: ${title}`} className="group absolute inset-0 block h-full w-full text-left">
          {cover}
          {children}
        </button>
      )}
    </div>
  );
}

/** The cover picture for a video: its own poster, else the YouTube thumbnail. */
function useCover(video: VideoTestimonial) {
  const source = videoSource(video.url);
  const cover = video.poster || source?.thumbnail || null;
  const [failed, setFailed] = useState(false);
  return { source, cover: cover && !failed ? cover : null, onError: () => setFailed(true) };
}

const stripQuotes = (quote: string) => quote.replace(/^[“"]|[”"]$/g, "");

/**
 * One tall (9:16) card: a cover picture and a play button. On phones tapping opens the
 * full-screen viewer; on larger screens the video plays in the card itself.
 */
function VideoCard({ video, inline, playing, onPlay }: { video: VideoTestimonial; inline: boolean; playing: boolean; onPlay: () => void }) {
  const { source, cover, onError } = useCover(video);
  const label = `Play video${video.name ? `: ${video.name}` : ""}`;
  const coverImage = cover && <img src={cover} alt="" loading="lazy" onError={onError} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />;
  const overlay = (
    <>
      <span className="absolute left-1/2 top-[44%] flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#E8722C] text-white shadow-lg transition-transform group-hover:scale-110">
        <Play className="h-7 w-7 fill-current" aria-hidden="true" />
      </span>
      {(video.name || video.role) && (
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-4 pb-3 pt-10 text-white">
          {video.name && <span className="block text-base font-bold leading-tight">{video.name}</span>}
          {video.role && <span className="block text-sm text-white/80">{video.role}</span>}
        </span>
      )}
    </>
  );
  const quote = video.quote && <p className="mt-3 text-[15px] italic leading-snug text-gray-700">&ldquo;{stripQuotes(video.quote)}&rdquo;</p>;

  if (inline && source?.kind === "youtube") {
    return (
      <div>
        <YouTubeFrame id={source.id} title={video.name || "Community story"} active={playing} cover={coverImage} onTap={onPlay}>
          {overlay}
        </YouTubeFrame>
        {quote}
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-[#2b251e]">
        {inline && playing && source ? (
          <iframe src={source.embedSrc} title={`Video testimonial${video.name ? `: ${video.name}` : ""}`} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen className="absolute inset-0 h-full w-full border-0" />
        ) : (
          <button type="button" onClick={onPlay} aria-label={label} className="group absolute inset-0 block h-full w-full text-left">
            {coverImage}
            {overlay}
          </button>
        )}
      </div>
      {quote}
    </div>
  );
}

/** Share of the screen width, on each side, where a tap turns the page. The middle is for pause and play. */
const EDGE = 0.28;

interface StoryApi {
  /** Opens the viewer on a story. Call it straight from the tap so the browser lets the video start with sound. */
  open: (index: number) => void;
}

/**
 * Full-screen story viewer, like Instagram stories.
 *  - Tap the left or right edge, or swipe sideways, to change story; tap the middle to pause or play.
 *  - Press and hold pauses while held; swipe up to leave. A story moves on when its video ends.
 *  - One YouTube player stays loaded behind the cards and is reused for every story, and a story is
 *    started straight from the tap that asks for it. That is what lets phones play with sound on the
 *    first tap (a player created after the tap is muted and needs a second one).
 * Google Drive videos keep their own controls in the middle, so for those only the edges are tap zones.
 */
function StoryViewer({ videos, ctaLabel, enabled, apiRef }: { videos: VideoTestimonial[]; ctaLabel: string; enabled: boolean; apiRef: React.MutableRefObject<StoryApi | null> }) {
  const [shown, setShown] = useState(false);
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hint, setHint] = useState(false);
  const [started, setStarted] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const [flash, setFlash] = useState<"left" | "right" | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const readyRef = useRef(false);
  const pendingRef = useRef<number | null>(null);
  const indexRef = useRef(0);
  const shownRef = useRef(false);
  const startedRef = useRef(false);
  const needsTapRef = useRef(false);
  const barSwipe = useRef<number | null>(null);
  const gesture = useRef<{ x: number; y: number; held: boolean; timer: number } | null>(null);
  const last = videos.length - 1;

  const load = useCallback(
    (to: number) => {
      indexRef.current = to;
      startedRef.current = false;
      needsTapRef.current = false;
      setIndex(to);
      setStarted(false);
      setNeedsTap(false);
      setPaused(false);
      setProgress(0);
      const source = videoSource(videos[to].url);
      const player = playerRef.current;
      if (source?.kind === "youtube") {
        if (player && readyRef.current) {
          player.loadVideoById(source.id);
          player.unMute();
          player.setVolume(100);
          pendingRef.current = null;
        } else {
          pendingRef.current = to;
        }
      } else if (player && readyRef.current) {
        player.pauseVideo();
      }
    },
    [videos],
  );
  const loadRef = useRef(load);
  loadRef.current = load;

  const go = (to: number) => {
    const target = Math.max(0, Math.min(last, to));
    if (target !== indexRef.current) load(target);
  };
  const close = useCallback(() => {
    shownRef.current = false;
    setShown(false);
    setPaused(false);
    playerRef.current?.pauseVideo?.();
  }, []);
  apiRef.current = {
    open: (to) => {
      shownRef.current = true;
      setShown(true);
      setHint(true);
      load(to);
    },
  };

  // The shared player: created once the section is near, then reused for every story.
  useEffect(() => {
    if (!enabled) return;
    const first = videos.map((video) => videoSource(video.url)).find((source) => source?.kind === "youtube");
    const host = hostRef.current;
    if (!host || !first) return;
    let cancelled = false;
    const mount = document.createElement("div");
    host.appendChild(mount);
    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;
        playerRef.current = new YT.Player(mount, {
          videoId: first.id,
          host: "https://www.youtube-nocookie.com",
          playerVars: { rel: 0, modestbranding: 1, playsinline: 1, controls: 0, disablekb: 1, fs: 0, iv_load_policy: 3 },
          events: {
            onReady: () => {
              readyRef.current = true;
              if (pendingRef.current !== null) loadRef.current(pendingRef.current);
            },
            onStateChange: (event) => {
              if (event.data === YT_PLAYING || event.data === YT_BUFFERING) {
                startedRef.current = true;
                needsTapRef.current = false;
                setStarted(true);
                setNeedsTap(false);
              } else if (event.data === YT_ENDED && shownRef.current && indexRef.current < last) {
                loadRef.current(indexRef.current + 1);
              }
            },
          },
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
      readyRef.current = false;
      mount.remove();
    };
  }, [enabled, videos, last]);

  // If the browser refuses to start the video by itself, say so: the next tap plays it (with sound).
  useEffect(() => {
    if (!shown) return;
    const timer = window.setTimeout(() => {
      if (!startedRef.current && videoSource(videos[indexRef.current].url)?.kind === "youtube") {
        needsTapRef.current = true;
        setNeedsTap(true);
      }
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [shown, index, videos]);

  useEffect(() => {
    if (!shown) return;
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      else if (event.key === "ArrowDown" || event.key === "ArrowRight") go(indexRef.current + 1);
      else if (event.key === "ArrowUp" || event.key === "ArrowLeft") go(indexRef.current - 1);
    };
    window.addEventListener("keydown", onKey);
    const hintTimer = window.setTimeout(() => setHint(false), 3400);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(hintTimer);
      document.body.style.overflow = overflow;
      opener?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, close]);

  // The next story's cover is fetched ahead so moving on feels instant.
  useEffect(() => {
    if (!shown) return;
    const upcoming = videos[index + 1];
    const src = upcoming && (upcoming.poster || videoSource(upcoming.url)?.thumbnail);
    if (src) new Image().src = src;
  }, [shown, index, videos]);

  // The current story's progress bar fills as its video plays.
  useEffect(() => {
    if (!shown) return;
    let frame = 0;
    let lastTick = 0;
    const tick = (now: number) => {
      if (now - lastTick > 100) {
        lastTick = now;
        const player = playerRef.current;
        const duration = readyRef.current && player ? player.getDuration() : 0;
        if (duration > 0) setProgress(Math.max(0, Math.min(1, player!.getCurrentTime() / duration)));
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [shown, index]);

  const video = videos[index];
  const source = videoSource(video.url);
  const isYouTube = source?.kind === "youtube";
  const cover = video.poster || source?.thumbnail || null;

  const flashSide = (side: "left" | "right") => {
    setFlash(side);
    window.setTimeout(() => setFlash(null), 220);
  };
  const togglePause = () => {
    const player = playerRef.current;
    if (!player || !readyRef.current) return;
    if (player.getPlayerState() === YT_PLAYING) {
      player.pauseVideo();
      setPaused(true);
    } else {
      player.playVideo();
      setPaused(false);
    }
  };

  const endGesture = (event: React.PointerEvent<HTMLElement>, cancelled: boolean) => {
    const g = gesture.current;
    if (!g) return;
    window.clearTimeout(g.timer);
    gesture.current = null;
    if (g.held) {
      playerRef.current?.playVideo();
      setPaused(false);
    }
    if (cancelled) return;
    const dx = event.clientX - g.x;
    const dy = event.clientY - g.y;
    if (dy < -60 && Math.abs(dy) > Math.abs(dx) * 1.2) {
      close();
      return;
    }
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      if (dx < 0) {
        flashSide("right");
        if (indexRef.current < last) go(indexRef.current + 1);
      } else {
        flashSide("left");
        go(indexRef.current - 1);
      }
      return;
    }
    if (g.held || Math.abs(dx) > 14 || Math.abs(dy) > 14) return;
    // A plain tap. If the video never started, the first tap just plays it, with sound.
    if (needsTapRef.current && isYouTube) {
      const player = playerRef.current;
      player?.unMute();
      player?.setVolume(100);
      player?.playVideo();
      return;
    }
    const box = (event.currentTarget.parentElement ?? event.currentTarget).getBoundingClientRect();
    const rel = (event.clientX - box.left) / box.width;
    if (rel < EDGE) {
      flashSide("left");
      go(indexRef.current - 1);
    } else if (rel > 1 - EDGE) {
      flashSide("right");
      if (indexRef.current >= last) close();
      else go(indexRef.current + 1);
    } else if (isYouTube) {
      togglePause();
    }
  };
  const zone = {
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Capture is only a nicety (keeps the gesture if the finger drifts off the zone).
      }
      gesture.current = {
        x: event.clientX,
        y: event.clientY,
        held: false,
        timer: window.setTimeout(() => {
          if (!gesture.current || needsTapRef.current) return;
          gesture.current.held = true;
          playerRef.current?.pauseVideo();
          setPaused(true);
        }, 260),
      };
    },
    onPointerUp: (event: React.PointerEvent<HTMLElement>) => endGesture(event, false),
    onPointerCancel: (event: React.PointerEvent<HTMLElement>) => endGesture(event, true),
  };
  const bar = {
    onPointerDown: (event: React.PointerEvent) => {
      barSwipe.current = event.clientY;
    },
    onPointerUp: (event: React.PointerEvent) => {
      if (barSwipe.current !== null && event.clientY - barSwipe.current < -50) close();
      barSwipe.current = null;
    },
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 sm:p-4"
      style={{ visibility: shown ? "visible" : "hidden" }}
      aria-hidden={!shown}
      inert={!shown}
      role="dialog"
      aria-modal="true"
      aria-label="Community stories"
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      data-testid="story-viewer"
    >
      <div className="relative flex h-[100dvh] w-screen flex-col overflow-hidden bg-[#16130F] text-white sm:h-[min(92vh,820px)] sm:w-auto sm:max-w-[94vw] sm:rounded-2xl sm:aspect-[9/17]">
        <div className="shrink-0 touch-none px-3 pb-2 pt-3" {...bar}>
          <div className="flex gap-1" aria-hidden="true">
            {videos.map((item, i) => (
              <span key={item.id ?? item.url} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
                <span className="block h-full rounded-full bg-white" style={{ width: `${i < index ? 100 : i === index ? (isYouTube ? progress * 100 : 100) : 0}%` }} />
              </span>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-white/70">
              {index + 1} of {videos.length}
            </span>
            <button ref={closeRef} type="button" onClick={close} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="relative min-h-0 flex-1 bg-black">
          {cover && isYouTube && !started && <img src={cover} alt="" className="absolute inset-0 h-full w-full object-contain" />}
          <div ref={hostRef} className={`absolute inset-0 [&_iframe]:h-full [&_iframe]:w-full ${isYouTube ? "" : "invisible"}`} />
          {!isYouTube && source && <iframe key={video.id ?? video.url} src={source.embedSrc} title={`Video testimonial${video.name ? `: ${video.name}` : ""}`} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen className="absolute inset-0 h-full w-full border-0" />}

          {isYouTube ? (
            <div className="absolute inset-0 z-10 touch-none select-none" data-testid="story-zone" {...zone} />
          ) : (
            <>
              <div className="absolute inset-y-0 left-0 z-10 touch-none select-none" style={{ width: `${EDGE * 100}%` }} data-testid="story-zone" {...zone} />
              <div className="absolute inset-y-0 right-0 z-10 touch-none select-none" style={{ width: `${EDGE * 100}%` }} {...zone} />
            </>
          )}

          <div className="pointer-events-none absolute inset-y-0 left-0 z-20 flex items-center bg-gradient-to-r from-white/30 to-transparent pl-2 transition-opacity duration-200" style={{ width: `${EDGE * 100}%`, opacity: flash === "left" ? 1 : hint ? 0.45 : 0 }}>
            <ChevronLeft className="h-8 w-8 text-white drop-shadow" aria-hidden="true" />
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 z-20 flex items-center justify-end bg-gradient-to-l from-white/30 to-transparent pr-2 transition-opacity duration-200" style={{ width: `${EDGE * 100}%`, opacity: flash === "right" ? 1 : hint ? 0.45 : 0 }}>
            <ChevronRight className="h-8 w-8 text-white drop-shadow" aria-hidden="true" />
          </div>

          {(paused || needsTap) && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/55">{needsTap ? <Play className="ml-1 h-7 w-7 fill-current text-white" aria-hidden="true" /> : <Pause className="h-7 w-7 fill-current text-white" aria-hidden="true" />}</span>
            </div>
          )}
          <p className={`pointer-events-none absolute inset-x-0 bottom-3 z-20 text-center text-xs font-semibold text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)] transition-opacity duration-700 ${hint ? "opacity-100" : "opacity-0"}`}>Tap the edges or swipe &middot; Swipe up to close</p>
        </div>

        <div className="shrink-0 touch-none px-4 pb-4 pt-3" {...bar}>
          {video.name && <p className="text-lg font-bold leading-tight">{video.name}</p>}
          {video.role && <p className="text-sm text-white/70">{video.role}</p>}
          {video.quote && <p className="mt-2 line-clamp-3 text-sm italic leading-snug text-white/85">&ldquo;{stripQuotes(video.quote)}&rdquo;</p>}
          <a href="#book-trial" onClick={close} className="mt-3 flex min-h-[48px] items-center justify-center gap-2 bg-[#E8722C] px-4 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-orange-600" data-testid="story-book">
            {ctaLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function VideoTestimonials({ videos, ctaLabel = "Book a free trial" }: { videos: VideoTestimonial[]; ctaLabel?: string }) {
  const viewRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState(0);
  const storyRef = useRef<StoryApi | null>(null);
  const [warm, setWarm] = useState(false);
  const [playing, setPlaying] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = viewRef.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Phones open the viewer on tap, so nothing is loaded behind the cards. Fetch YouTube's
  // player code ahead of time (once the section is close) so the tap starts the video at
  // once instead of waiting on a download.
  const phone = width > 0 && width < 640;
  useEffect(() => {
    const el = viewRef.current;
    if (!phone || !el || !videos.some((video) => videoSource(video.url)?.kind === "youtube")) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        setWarm(true);
        preconnect("https://www.youtube-nocookie.com");
        preconnect("https://i.ytimg.com");
        loadYouTubeApi().catch(() => {});
      },
      { rootMargin: "800px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [phone, videos]);

  // Four across on wide screens, three on tablets, one with the next peeking on phones.
  const perView = width >= 1000 ? 4 : width >= 640 ? 3 : 1;
  const cardWidth = perView === 1 ? Math.round(width * 0.74) : Math.floor((width - GAP * (perView - 1)) / perView);
  const count = videos.length;
  const scrolls = count > perView;
  const sidePad = perView === 1 ? Math.round((width - cardWidth) / 2) : 0;

  // The first fully visible card (or, on phones, the centred one).
  const updateActive = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const mark = perView === 1 ? track.scrollLeft + track.clientWidth / 2 : track.scrollLeft;
    let best = 0;
    let bestDistance = Infinity;
    cardRefs.current.forEach((card, index) => {
      if (!card) return;
      const point = perView === 1 ? card.offsetLeft + card.offsetWidth / 2 : card.offsetLeft;
      const distance = Math.abs(point - mark);
      if (distance < bestDistance) {
        best = index;
        bestDistance = distance;
      }
    });
    setActive(best);
  }, [perView]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateActive);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    updateActive();
    return () => {
      track.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [updateActive, count, perView, cardWidth]);

  const scrollToCard = (index: number) => {
    const track = trackRef.current;
    const card = cardRefs.current[index];
    if (!track || !card) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const left = perView === 1 ? card.offsetLeft + card.offsetWidth / 2 - track.clientWidth / 2 : card.offsetLeft;
    track.scrollTo({ left, behavior: reduced ? "auto" : "smooth" });
  };

  const step = (direction: -1 | 1) => scrollToCard(Math.max(0, Math.min(count - 1, active + direction * (perView === 1 ? 1 : perView))));
  const maxFirst = Math.max(0, count - perView);

  if (count === 0) return null;

  return (
    <div ref={viewRef} className="relative" data-testid="video-testimonials">
      {scrolls && (
        <>
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={active === 0}
            aria-label="Previous video"
            className="absolute left-1 top-[36%] z-10 flex h-11 w-11 items-center justify-center rounded-full border border-black/15 bg-white text-gray-900 shadow-lg transition-colors hover:border-[#E8722C] hover:text-[#E8722C] disabled:pointer-events-none disabled:opacity-25 md:-left-5"
            data-testid="video-prev"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            disabled={active >= maxFirst}
            aria-label="Next video"
            className="absolute right-1 top-[36%] z-10 flex h-11 w-11 items-center justify-center rounded-full bg-[#E8722C] text-white shadow-lg transition-colors hover:bg-orange-600 disabled:pointer-events-none disabled:opacity-25 md:-right-5"
            data-testid="video-next"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
      <div
        ref={trackRef}
        className="relative flex snap-x snap-mandatory overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ gap: perView === 1 ? 12 : GAP, paddingInline: sidePad }}
        tabIndex={scrolls ? 0 : undefined}
        aria-roledescription="carousel"
        aria-label="Video testimonials"
      >
        {videos.map((video, index) => (
          <div
            key={video.id ?? video.url}
            ref={(node) => {
              cardRefs.current[index] = node;
            }}
            className={`shrink-0 ${perView === 1 ? "snap-center" : "snap-start"}`}
            style={{ width: cardWidth || undefined }}
            data-testid={`video-card-${index}`}
          >
            <VideoCard video={video} inline={perView > 1} playing={playing === index} onPlay={() => {
              if (perView === 1) {
                setWarm(true);
                storyRef.current?.open(index);
              } else setPlaying(index);
            }} />
          </div>
        ))}
      </div>
      {scrolls && perView === 1 && (
        <div className="mt-4 flex justify-center gap-1.5" role="tablist" aria-label="Choose a video">
          {videos.map((video, index) => (
            <button
              key={video.id ?? video.url}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={`Video ${index + 1}${video.name ? `: ${video.name}` : ""}`}
              onClick={() => scrollToCard(index)}
              className={`h-1.5 rounded-full transition-all ${index === active ? "w-5 bg-[#E8722C]" : "w-1.5 bg-gray-300"}`}
            />
          ))}
        </div>
      )}
      {phone && <StoryViewer videos={videos} ctaLabel={ctaLabel} enabled={warm} apiRef={storyRef} />}
    </div>
  );
}
