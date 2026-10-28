"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Play, X } from "lucide-react";
import { YT_BUFFERING, YT_PLAYING, loadYouTubeApi, type YTPlayer } from "@/lib/youtubeApi";
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

/** The video in the viewer: a YouTube player (started straight away) or a Google Drive preview. */
function ViewerVideo({ video }: { video: VideoTestimonial }) {
  const { source, cover, onError } = useCover(video);
  if (!source) return null;
  if (source.kind === "youtube") {
    const coverImage = cover && <img src={cover} alt="" onError={onError} className="absolute inset-0 h-full w-full object-contain" />;
    return <YouTubeFrame id={source.id} title={video.name || "Community story"} active cover={coverImage} onTap={() => {}} className="h-full w-full bg-black" />;
  }
  return <iframe src={source.embedSrc} title={`Video testimonial${video.name ? `: ${video.name}` : ""}`} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen className="h-full w-full border-0" />;
}

/**
 * Full-screen viewer: one story at a time, tall on phones. Move with the arrows,
 * the keyboard, or by swiping the bars above and below the video (a video itself
 * swallows touches). Every story has the booking button right under it.
 */
function StoryViewer({ videos, start, ctaLabel, onClose }: { videos: VideoTestimonial[]; start: number; ctaLabel: string; onClose: () => void }) {
  const [index, setIndex] = useState(start);
  const closeRef = useRef<HTMLButtonElement>(null);
  const swipeY = useRef<number | null>(null);
  const last = videos.length - 1;
  const go = useCallback((to: number) => setIndex(Math.max(0, Math.min(last, to))), [last]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowDown" || event.key === "ArrowRight") setIndex((current) => Math.min(last, current + 1));
      else if (event.key === "ArrowUp" || event.key === "ArrowLeft") setIndex((current) => Math.max(0, current - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      opener?.focus?.();
    };
  }, [last, onClose]);

  // The next story's cover is fetched ahead so moving on feels instant.
  useEffect(() => {
    const next = videos[index + 1];
    const src = next && (next.poster || videoSource(next.url)?.thumbnail);
    if (src) new Image().src = src;
  }, [index, videos]);

  const video = videos[index];
  const swipe = {
    onPointerDown: (event: React.PointerEvent) => {
      swipeY.current = event.clientY;
    },
    onPointerUp: (event: React.PointerEvent) => {
      if (swipeY.current === null) return;
      const distance = event.clientY - swipeY.current;
      swipeY.current = null;
      if (distance < -50) go(index + 1);
      else if (distance > 50) go(index - 1);
    },
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Community stories"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      data-testid="story-viewer"
    >
      <div className="relative flex h-[100dvh] w-screen flex-col overflow-hidden bg-[#16130F] text-white sm:h-[min(92vh,820px)] sm:w-auto sm:max-w-[94vw] sm:rounded-2xl sm:aspect-[9/17]">
        <div className="shrink-0 touch-none px-3 pb-2 pt-3" {...swipe}>
          <div className="flex gap-1" aria-hidden="true">
            {videos.map((item, i) => (
              <span key={item.id ?? item.url} className={`h-[3px] flex-1 rounded-full ${i <= index ? "bg-white" : "bg-white/30"}`} />
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-white/70">
              {index + 1} of {videos.length}
            </span>
            <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 bg-black">
          <ViewerVideo key={video.id ?? video.url} video={video} />
        </div>

        <div className="shrink-0 touch-none px-4 pb-4 pt-3" {...swipe}>
          {video.name && <p className="text-lg font-bold leading-tight">{video.name}</p>}
          {video.role && <p className="text-sm text-white/70">{video.role}</p>}
          {video.quote && <p className="mt-2 line-clamp-3 text-sm italic leading-snug text-white/85">&ldquo;{stripQuotes(video.quote)}&rdquo;</p>}
          <div className="mt-3 flex items-stretch gap-2">
            <button type="button" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous story" className="flex w-12 items-center justify-center rounded-sm bg-white/15 transition-colors hover:bg-white/25 disabled:opacity-30" data-testid="story-prev">
              <ChevronUp className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => go(index + 1)} disabled={index === last} aria-label="Next story" className="flex w-12 items-center justify-center rounded-sm bg-white/15 transition-colors hover:bg-white/25 disabled:opacity-30" data-testid="story-next">
              <ChevronDown className="h-5 w-5" />
            </button>
            <a href="#book-trial" onClick={onClose} className="flex min-h-[48px] flex-1 items-center justify-center gap-2 bg-[#E8722C] px-4 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-orange-600" data-testid="story-book">
              {ctaLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
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
  const [open, setOpen] = useState<number | null>(null);
  const [playing, setPlaying] = useState<number | null>(null);
  const closeViewer = useCallback(() => setOpen(null), []);

  useLayoutEffect(() => {
    const el = viewRef.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
            <VideoCard video={video} inline={perView > 1} playing={playing === index} onPlay={() => (perView === 1 ? setOpen(index) : setPlaying(index))} />
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
      {open !== null && perView === 1 && <StoryViewer videos={videos} start={open} ctaLabel={ctaLabel} onClose={closeViewer} />}
    </div>
  );
}
