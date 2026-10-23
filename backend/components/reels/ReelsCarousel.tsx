"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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

const EMBED_TIMEOUT_MS = 8000;
// When every reel fits on one row at this width or more, they're all shown at once.
const CARD_MIN = 200;
const CARD_MAX = 230;
const CARD_GAP = 12;
// Never more than this many live Instagram embeds on the page at once.
const MAX_LIVE = 4;

/** One reel card: a poster until it's the centred reel, then the live Instagram embed. */
function ReelCard({ reel, wantLive, nearViewport }: { reel: Reel; wantLive: boolean; nearViewport: boolean }) {
  const src = embedSrc(reel.url);
  const live = wantLive && nearViewport && !!src && !isPlaceholderReel(reel);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  // A new reel starts fresh.
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

  const showPoster = !live || !loaded || failed;

  return (
    <div className="relative aspect-[9/19] w-full overflow-hidden rounded-lg bg-[#2b251e]">
      {live && !failed && (
        <iframe
          src={src!}
          title={`Instagram reel: ${reel.caption}`}
          loading="lazy"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          onLoad={() => setLoaded(true)}
          className={`absolute inset-0 h-full w-full border-0 bg-white transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      )}
      {showPoster && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
          {reel.poster && <img src={reel.poster} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
          <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-[#E8722C] text-white">
            <Play className="h-5 w-5 fill-current" aria-hidden="true" />
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
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const viewRef = useRef<HTMLDivElement>(null);
  const [nearViewport, setNearViewport] = useState(false);
  const [width, setWidth] = useState(0);

  // Only start loading Instagram once the section is close to the screen.
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
      { rootMargin: "300px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Measure the space for the reels, so we can show them all at once when they fit.
  useLayoutEffect(() => {
    const el = viewRef.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const count = reels.length;
  const fit = count > 0 && width > 0 && count * CARD_MIN + (count - 1) * CARD_GAP <= width;
  const fitWidth = count > 0 ? Math.min(CARD_MAX, Math.floor((width - (count - 1) * CARD_GAP) / count)) : CARD_MAX;
  // The reels (up to MAX_LIVE) closest to the selected one are live embeds; the rest stay as posters.
  const liveSet = new Set(
    reels
      .map((_, index) => index)
      .sort((a, b) => Math.abs(a - active) - Math.abs(b - active))
      .slice(0, MAX_LIVE),
  );

  // The active reel is whichever card sits closest to the middle of the track.
  const updateActive = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const middle = track.scrollLeft + track.clientWidth / 2;
    let best = 0;
    let bestDistance = Infinity;
    cardRefs.current.forEach((card, index) => {
      if (!card) return;
      const distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - middle);
      if (distance < bestDistance) {
        best = index;
        bestDistance = distance;
      }
    });
    setActive(best);
  }, []);

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
  }, [updateActive, reels.length, fit]);

  const goTo = (index: number) => {
    const track = trackRef.current;
    const card = cardRefs.current[index];
    if (!track || !card) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollTo({ left: card.offsetLeft + card.offsetWidth / 2 - track.clientWidth / 2, behavior: reduced ? "auto" : "smooth" });
  };

  if (reels.length === 0) return null;
  const current = reels[Math.min(active, reels.length - 1)];

  return (
    <section ref={sectionRef} className="overflow-hidden bg-[#16130F] py-16 text-white md:py-24" aria-label={title} data-testid="reels-carousel">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:gap-14">
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-[0.22em] text-[#E8722C]">{eyebrow}</span>
            <h2 className="mt-3 text-4xl font-black uppercase leading-none tracking-tighter md:text-5xl">{title}</h2>
            <p className="mt-5 max-w-sm text-base leading-relaxed text-white/65">{text}</p>
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

          <div className="min-w-0" ref={viewRef}>
            {fit ? (
              <div className="flex items-start justify-center py-6" style={{ gap: CARD_GAP }} data-testid="reels-all">
                {reels.map((reel, index) => (
                  <div key={reel.url} className="shrink-0" style={{ width: fitWidth }} onClick={() => setActive(index)} data-testid={`reel-card-${index}`}>
                    <ReelCard reel={reel} wantLive={liveSet.has(index)} nearViewport={nearViewport} />
                    <p className="mt-3 text-sm font-bold leading-snug">{reel.caption}</p>
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
            ) : (
              <>
            <div className="relative">
            {reels.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => goTo(Math.max(0, active - 1))}
                  disabled={active === 0}
                  aria-label="Previous reel"
                  className="absolute left-1 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-[#16130F]/85 text-white shadow-lg transition-colors hover:border-[#E8722C] hover:text-[#E8722C] disabled:pointer-events-none disabled:opacity-25 sm:left-3"
                  data-testid="reel-prev"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={() => goTo(Math.min(reels.length - 1, active + 1))}
                  disabled={active === reels.length - 1}
                  aria-label="Next reel"
                  className="absolute right-1 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-[#E8722C] text-white shadow-lg transition-colors hover:bg-orange-600 disabled:pointer-events-none disabled:opacity-25 sm:right-3"
                  data-testid="reel-next"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
            <div
              ref={trackRef}
              className="relative flex snap-x snap-mandatory items-center gap-3 overflow-x-auto py-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{
                ["--cw" as string]: "min(60vw, 230px)",
                paddingInline: "calc(50% - var(--cw) / 2)",
              }}
              tabIndex={0}
              aria-roledescription="carousel"
              aria-label="Instagram reels"
            >
              {reels.map((reel, index) => (
                <div
                  key={reel.url}
                  ref={(node) => {
                    cardRefs.current[index] = node;
                  }}
                  onClick={() => index !== active && goTo(index)}
                  className={`w-[var(--cw)] shrink-0 snap-center transition-[opacity,transform] duration-300 motion-reduce:transition-none ${
                    index === active ? "scale-100 opacity-100" : "scale-[0.84] cursor-pointer opacity-45"
                  }`}
                  aria-hidden={index === active ? undefined : true}
                  data-testid={`reel-card-${index}`}
                >
                  <div className={index === active ? "rounded-lg outline outline-2 outline-offset-2 outline-[#E8722C]" : ""}>
                    <ReelCard reel={reel} wantLive={index === active} nearViewport={nearViewport} />
                  </div>
                </div>
              ))}
            </div>
            </div>

            <div className="mt-2 text-center">
              <p className="text-base font-bold" data-testid="reel-caption">{current.caption}</p>
              <a
                href={current.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-[#E8722C] hover:underline"
                data-testid="link-reel-watch"
              >
                {watchLabel} <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>

            {reels.length > 1 && (
              <div className="mt-4 flex justify-center gap-1.5" role="tablist" aria-label="Choose a reel">
                {reels.map((reel, index) => (
                  <button
                    key={reel.url}
                    type="button"
                    role="tab"
                    aria-selected={index === active}
                    aria-label={`Reel ${index + 1}: ${reel.caption}`}
                    onClick={() => goTo(index)}
                    className={`h-1.5 rounded-full transition-all ${index === active ? "w-5 bg-[#E8722C]" : "w-1.5 bg-white/30"}`}
                  />
                ))}
              </div>
            )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
