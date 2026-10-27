"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { preconnect } from "react-dom";
import { ArrowUpRight, ChevronLeft, ChevronRight, Instagram, Play } from "lucide-react";
import { INSTAGRAM_URL, embedSrc, isPlaceholderReel, type Reel } from "@/lib/reels";

interface ReelsCarouselProps {
  reels: Reel[];
  eyebrow?: string;
  title?: string;
  text?: string;
  followLabel?: string;
  watchLabel?: string;
}

const EMBED_TIMEOUT_MS = 12000;
const GAP = 16;
// Never more than this many Instagram embeds kept loaded at once. Embeds that
// have loaded stay mounted while the visitor swipes, so nothing reloads or flashes.
const MAX_LIVE = 6;

/**
 * One reel card. The cover (uploaded image, or a brand-coloured card) is always
 * there, so something shows instantly; the live Instagram embed loads behind it
 * and fades in once it is ready.
 */
function ReelCard({ reel, wantLive, nearViewport }: { reel: Reel; wantLive: boolean; nearViewport: boolean }) {
  const src = embedSrc(reel.url);
  const live = wantLive && nearViewport && !!src && !isPlaceholderReel(reel);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  // A reel that stops being live starts fresh next time.
  useEffect(() => {
    if (!live) {
      setLoaded(false);
      setFailed(false);
    }
  }, [live]);

  // A blocked or slow embed can't be detected directly, so give it a few seconds
  // to load. The timer stops as soon as the embed has loaded, so it can never cut
  // a reel that is playing.
  useEffect(() => {
    if (!live || loaded) return;
    const timer = window.setTimeout(() => setFailed(true), EMBED_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [live, loaded]);

  const covered = !live || !loaded || failed;

  return (
    <div className="relative aspect-[9/17.5] w-full overflow-hidden rounded-xl bg-[#2b251e]">
      {covered && (
        <div className={`absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center ${reel.poster || failed || isPlaceholderReel(reel) ? "" : "animate-pulse bg-gradient-to-b from-[#3a3128] to-[#2b251e]"}`}>
          {reel.poster && <img src={reel.poster} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
          <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-[#E8722C] text-white shadow-lg">
            <Play className="h-6 w-6 fill-current" aria-hidden="true" />
          </span>
          {isPlaceholderReel(reel) ? (
            <span className="relative z-10 text-[11px] font-bold uppercase tracking-wider text-white/60">Placeholder reel</span>
          ) : failed ? (
            <a
              href={reel.url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-10 text-xs font-bold uppercase tracking-wider text-white underline underline-offset-4"
            >
              Open on Instagram
            </a>
          ) : null}
        </div>
      )}
      {live && !failed && (
        <iframe
          src={src!}
          title={reel.caption ? `Instagram reel: ${reel.caption}` : "Instagram reel"}
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          onLoad={() => setLoaded(true)}
          className={`absolute inset-0 h-full w-full border-0 bg-transparent transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </div>
  );
}

export function ReelsCarousel({
  reels,
  eyebrow = "Instagram",
  title = "Follow the action",
  text = "Training, game days and life at the academy. New reels every week.",
  followLabel = "Follow us on Instagram",
  watchLabel = "Watch on Instagram",
}: ReelsCarouselProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [nearViewport, setNearViewport] = useState(false);
  const [width, setWidth] = useState(0);
  const [first, setFirst] = useState(0);

  // Open the connections to Instagram early so the first embed starts sooner.
  useEffect(() => {
    preconnect("https://www.instagram.com", { crossOrigin: "anonymous" });
    preconnect("https://static.cdninstagram.com", { crossOrigin: "anonymous" });
  }, []);

  // Only start loading Instagram once the section is within a screen or so.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: "1200px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const el = viewRef.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Four across on desktop, two on tablets, one big card with the next peeking on phones.
  const perView = width >= 1000 ? 4 : width >= 640 ? 2 : 1;
  const cardWidth = perView === 1 ? Math.round(width * 0.9) : Math.floor((width - GAP * (perView - 1)) / perView);
  const count = reels.length;
  const scrolls = count > perView;
  const sidePad = perView === 1 ? Math.round((width - cardWidth) / 2) : 0;

  // The first fully visible card (or, on phones, the centred one).
  const updateFirst = useCallback(() => {
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
    setFirst(best);
  }, [perView]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateFirst);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    updateFirst();
    return () => {
      track.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [updateFirst, count, perView, cardWidth]);

  const goTo = (index: number) => {
    const track = trackRef.current;
    const card = cardRefs.current[index];
    if (!track || !card) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const left = perView === 1 ? card.offsetLeft + card.offsetWidth / 2 - track.clientWidth / 2 : card.offsetLeft;
    track.scrollTo({ left, behavior: reduced ? "auto" : "smooth" });
  };

  const maxFirst = Math.max(0, count - perView);
  const step = (direction: -1 | 1) => goTo(Math.max(0, Math.min(maxFirst, first + direction * (perView === 1 ? 1 : perView))));

  // Which embeds are loaded: the visible cards at once, the next screenful a moment
  // later, so the ones being looked at get the bandwidth first. Once loaded they
  // stay; only if more than MAX_LIVE pile up are the furthest from view dropped.
  const [live, setLive] = useState<Set<number>>(() => new Set());
  useEffect(() => {
    if (!nearViewport) return;
    const grow = (upTo: number) =>
      setLive((previous) => {
        const next = new Set(previous);
        for (let index = first; index < Math.min(count, upTo); index++) next.add(index);
        if (next.size > MAX_LIVE) {
          [...next].sort((a, b) => Math.abs(b - first) - Math.abs(a - first)).slice(0, next.size - MAX_LIVE).forEach((index) => next.delete(index));
        }
        return next;
      });
    grow(first + (perView === 1 ? 2 : perView));
    const timer = window.setTimeout(() => grow(first + (perView === 1 ? 3 : perView * 2)), 1200);
    return () => window.clearTimeout(timer);
  }, [nearViewport, first, perView, count]);
  const liveSet = live;

  if (count === 0) return null;

  return (
    <section ref={sectionRef} className="overflow-hidden bg-[#16130F] py-14 text-white md:py-20" aria-label={title} data-testid="reels-carousel">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="block text-[11px] font-bold uppercase tracking-[0.22em] text-[#E8722C]">{eyebrow}</span>
          <h2 className="mt-3 text-4xl font-black uppercase leading-none tracking-tighter md:text-6xl">{title}</h2>
          {text && <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-white/65 md:text-lg">{text}</p>}
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 inline-flex min-h-[48px] items-center gap-2 bg-[#E8722C] px-6 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-orange-600"
            data-testid="link-reels-follow"
          >
            <Instagram className="h-4 w-4" aria-hidden="true" /> {followLabel}
          </a>
        </div>

        <div ref={viewRef} className="relative mt-10 md:mt-12 md:px-6">
          {scrolls && (
            <>
              <button
                type="button"
                onClick={() => step(-1)}
                disabled={first === 0}
                aria-label="Previous reel"
                className="absolute left-1 top-[40%] z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-[#16130F]/85 text-white shadow-lg transition-colors hover:border-[#E8722C] hover:text-[#E8722C] disabled:pointer-events-none disabled:opacity-25 md:-left-3"
                data-testid="reel-prev"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                disabled={first >= maxFirst}
                aria-label="Next reel"
                className="absolute right-1 top-[40%] z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-[#E8722C] text-white shadow-lg transition-colors hover:bg-orange-600 disabled:pointer-events-none disabled:opacity-25 md:-right-3"
                data-testid="reel-next"
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
            aria-label="Instagram reels"
            data-testid="reels-track"
          >
            {reels.map((reel, index) => (
              <div
                key={reel.url}
                ref={(node) => {
                  cardRefs.current[index] = node;
                }}
                className={`shrink-0 ${perView === 1 ? "snap-center" : "snap-start"}`}
                style={{ width: cardWidth || undefined }}
                data-testid={`reel-card-${index}`}
              >
                <ReelCard reel={reel} wantLive={liveSet.has(index)} nearViewport={nearViewport} />
                {reel.caption && <p className="mt-3 text-sm font-bold leading-snug">{reel.caption}</p>}
                <a
                  href={reel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#E8722C] hover:underline"
                  data-testid={`link-reel-watch-${index}`}
                >
                  {watchLabel} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            ))}
          </div>
          {scrolls && (
            <p className="mt-4 text-center text-xs text-white/50" aria-live="polite">
              {perView === 1 ? `${first + 1} of ${count}` : `${first + 1}–${Math.min(count, first + perView)} of ${count}`}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
