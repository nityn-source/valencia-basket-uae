"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { FilmDialog } from "./FilmDialog";
import { useVimeoSound } from "./useVimeoSound";
import { formatDuration, vimeoPlayerSrc, type VimeoVideo } from "@/lib/vimeo";

/** True when the visitor wants less motion or less data, so the film shouldn't start by itself. */
function prefersStill() {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches || !!connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? "");
}

/**
 * The film on an event card, as a poster: a tall 9:16 frame with a white border and a solid orange
 * offset block behind it. It shows its cover at once, plays a silent loop once the page has loaded and
 * the card is on screen. Tapping the film opens the full player with sound already on; the small sound
 * button only changes the sound in place. On a card nothing starts sound by itself. The frame is exactly
 * 9:16, so nothing is cropped.
 */
export function EventCardVideo({
  video,
  poster,
  title,
  seconds,
  shape = { width: 9, height: 16 },
}: {
  video: VimeoVideo;
  poster: string | null;
  title: string;
  seconds: number;
  shape?: { width: number; height: number };
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const tapRef = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [open, setOpen] = useState(false);
  const [forced, setForced] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const pendingSound = useRef(false);
  const { soundOn, setSound, resetSound } = useVimeoSound(frameRef);

  // Wait until the page has loaded and the card is on screen before loading Vimeo.
  useEffect(() => {
    const host = hostRef.current;
    if (!host || prefersStill()) return;
    let seen = false;
    let ready = document.readyState === "complete";
    const maybe = () => { if (seen && ready) setVisible(true); };
    const onLoad = () => { ready = true; maybe(); };
    if (!ready) window.addEventListener("load", onLoad, { once: true });
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { seen = true; maybe(); observer.disconnect(); } }, { threshold: 0.4 });
    observer.observe(host);
    return () => { observer.disconnect(); window.removeEventListener("load", onLoad); };
  }, []);

  const loopLive = (visible || forced) && !open;
  useEffect(() => { if (!loopLive) { setLoaded(false); setPlaying(false); resetSound(); } }, [loopLive]); // eslint-disable-line react-hooks/exhaustive-deps
  // The sound button was pressed before the film was playing: start it in place, then turn the sound on.
  useEffect(() => {
    if (playing && pendingSound.current) { pendingSound.current = false; setSound(true); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);
  useEffect(() => {
    if (!loaded) return;
    const timer = window.setTimeout(() => setPlaying(true), 700);
    return () => window.clearTimeout(timer);
  }, [loaded]);

  const ratio = `${shape.width} / ${shape.height}`;

  return (
    <>
      <div
        ref={hostRef}
        className="relative h-[267px] shrink-0 overflow-hidden border-[3px] border-white bg-black shadow-[10px_10px_0_#ff6c0e] md:h-[340px]"
        style={{ aspectRatio: ratio }}
        data-testid="event-card-video"
      >
          {poster && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={poster} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
          )}
          {loopLive && (
            <iframe
              ref={frameRef}
              src={vimeoPlayerSrc(video, "loop")}
              title={`${title} (silent preview)`}
              allow="autoplay; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              tabIndex={-1}
              aria-hidden="true"
              onLoad={() => setLoaded(true)}
              className={`pointer-events-none absolute inset-0 h-full w-full border-0 transition-opacity duration-500 ${playing ? "opacity-100" : "opacity-0"}`}
            />
          )}
          <button
            ref={tapRef}
            type="button"
            onClick={() => { pendingSound.current = false; setOpen(true); }}
            aria-label={`Watch the camp film full size, with sound${seconds ? ` (${formatDuration(seconds)})` : ""}`}
            className="absolute inset-0 z-10 cursor-pointer focus-visible:outline focus-visible:outline-4 focus-visible:-outline-offset-4 focus-visible:outline-white"
            data-testid="button-event-card-film"
          >
            {!playing && (
              <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-white shadow-lg" aria-hidden="true">
                <span className="ml-0.5 h-0 w-0 border-y-[9px] border-l-[14px] border-y-transparent border-l-white" />
              </span>
            )}
          </button>
          {/* Sound switch: only changes the sound, in place. If the film isn't playing yet it starts it here and turns the sound on. */}
          <button
            type="button"
            data-sound-toggle
            onClick={() => {
              if (!playing) { pendingSound.current = true; setForced(true); return; }
              setSound(!soundOn);
            }}
            aria-label={soundOn ? "Mute the camp film" : "Turn the camp film sound on"}
            aria-pressed={soundOn}
            className="absolute bottom-2 right-2 z-20 inline-flex min-h-[34px] items-center gap-1 bg-black/75 px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-white ring-1 ring-white/40 hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            data-testid="button-event-card-film-sound"
          >
            {soundOn ? <><VolumeX className="h-3 w-3" aria-hidden="true" /> Mute</> : <><Volume2 className="h-3 w-3" aria-hidden="true" /> Sound on{seconds ? ` · ${formatDuration(seconds)}` : ""}</>}
          </button>
      </div>
      <FilmDialog open={open} onOpenChange={setOpen} video={video} title={title} ratio={ratio} onCloseFocus={() => tapRef.current?.focus()} />
    </>
  );
}
