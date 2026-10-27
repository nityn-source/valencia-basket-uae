"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { videoSource, type VideoTestimonial } from "@/lib/videoTestimonials";

const GAP = 20;

/** One wide (16:9) card: a cover picture until tapped, then the YouTube or Google Drive player. */
function VideoCard({ video, playing, onPlay }: { video: VideoTestimonial; playing: boolean; onPlay: () => void }) {
  const source = videoSource(video.url);
  const cover = video.poster || source?.thumbnail || null;
  const [coverFailed, setCoverFailed] = useState(false);

  return (
    <div>
      <div className="relative aspect-video overflow-hidden rounded-xl bg-[#2b251e]">
        {playing && source ? (
          <iframe
            src={source.embedSrc}
            title={`Video testimonial: ${video.name}`}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          <button type="button" onClick={onPlay} aria-label={`Play video: ${video.name}`} className="group absolute inset-0 block h-full w-full text-left">
            {cover && !coverFailed && (
              <img src={cover} alt="" loading="lazy" onError={() => setCoverFailed(true)} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            )}
            <span className="absolute left-1/2 top-[44%] flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#E8722C] text-white shadow-lg transition-transform group-hover:scale-110">
              <Play className="h-7 w-7 fill-current" aria-hidden="true" />
            </span>
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-4 pb-3 pt-10 text-white">
              <span className="block text-base font-bold leading-tight">{video.name}</span>
              {video.role && <span className="block text-sm text-white/80">{video.role}</span>}
            </span>
          </button>
        )}
      </div>
      {video.quote && <p className="mt-3 text-[15px] italic leading-snug text-gray-700">&ldquo;{video.quote.replace(/^[“"]|[”"]$/g, "")}&rdquo;</p>}
    </div>
  );
}

export function VideoTestimonials({ videos }: { videos: VideoTestimonial[] }) {
  const viewRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState(0);
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

  // Three across on wide screens, two on tablets, one with the next peeking on phones.
  const perView = width >= 900 ? 3 : width >= 600 ? 2 : 1;
  const cardWidth = perView === 1 ? Math.round(width * 0.9) : Math.floor((width - GAP * (perView - 1)) / perView);
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
  }, [updateActive, count, perView]);

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
            className="absolute left-1 top-[28%] z-10 flex h-11 w-11 items-center justify-center rounded-full border border-black/15 bg-white text-gray-900 shadow-lg transition-colors hover:border-[#E8722C] hover:text-[#E8722C] disabled:pointer-events-none disabled:opacity-25 md:-left-5"
            data-testid="video-prev"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            disabled={active >= maxFirst}
            aria-label="Next video"
            className="absolute right-1 top-[28%] z-10 flex h-11 w-11 items-center justify-center rounded-full bg-[#E8722C] text-white shadow-lg transition-colors hover:bg-orange-600 disabled:pointer-events-none disabled:opacity-25 md:-right-5"
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
            <VideoCard video={video} playing={playing === index} onPlay={() => setPlaying(index)} />
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
              aria-label={`Video ${index + 1}: ${video.name}`}
              onClick={() => scrollToCard(index)}
              className={`h-1.5 rounded-full transition-all ${index === active ? "w-5 bg-[#E8722C]" : "w-1.5 bg-gray-300"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
