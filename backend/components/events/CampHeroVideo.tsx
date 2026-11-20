"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { FilmDialog } from "./FilmDialog";
import { formatDuration, vimeoPlayerSrc, type VimeoVideo } from "@/lib/vimeo";

/** True when the visitor has asked for less motion or less data, so the film shouldn't start by itself. */
function prefersStill() {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    !!connection?.saveData ||
    /(^|-)2g$/.test(connection?.effectiveType ?? "")
  );
}

/**
 * The camp film in the Winter Camp hero: a vertical 9:16 card that shows its cover
 * picture at once, starts a silent loop once the page has loaded, and opens the full
 * player with sound when tapped. Nothing is cropped: the card is exactly 9:16.
 */
export function CampHeroVideo({
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
  const [loopOn, setLoopOn] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [open, setOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const tapRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const onScreen = useRef(false);
  const chosenMute = useRef(false);

  // Browsers only allow sound after the visitor has tapped or clicked something, so the silent loop
  // is switched to sound by the first tap, click or key press, but only while the film is on screen.
  const setSound = (on: boolean) => {
    const player = frameRef.current?.contentWindow;
    if (!player) return;
    const send = (method: string, value: boolean | number) => player.postMessage(JSON.stringify({ method, value }), "https://player.vimeo.com");
    send("setMuted", !on);
    if (on) send("setVolume", 1);
    setSoundOn(on);
  };

  // Start the silent loop after the page has finished loading, so it never slows the first paint.
  useEffect(() => {
    if (prefersStill()) return;
    let timer = 0;
    const start = () => { timer = window.setTimeout(() => setLoopOn(true), 400); };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => { window.removeEventListener("load", start); window.clearTimeout(timer); };
  }, []);

  // While the sound-on player is open the silent loop stops.
  const loopLive = loopOn && !open;
  useEffect(() => { if (!loopLive) { setPlaying(false); setSoundOn(false); } }, [loopLive]);

  // Is at least half of the film on screen?
  useEffect(() => {
    const card = cardRef.current;
    if (!card || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => { onScreen.current = entry.isIntersecting && entry.intersectionRatio >= 0.5; }, { threshold: [0, 0.5, 1] });
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  // The first tap, click or key press anywhere starts the sound (unless the visitor chose to mute, or tapped the sound button itself).
  useEffect(() => {
    if (!playing || soundOn) return;
    const first = (event: Event) => {
      const target = event.target as Element | null;
      if (target?.closest?.("[data-sound-toggle], [role='dialog']")) return;
      if (chosenMute.current || !onScreen.current) return;
      setSound(true);
    };
    document.addEventListener("pointerdown", first, { once: true, passive: true });
    document.addEventListener("keydown", first, { once: true, passive: true });
    return () => { document.removeEventListener("pointerdown", first); document.removeEventListener("keydown", first); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, soundOn]);

  const ratio = `${shape.width} / ${shape.height}`;
  const label = `Watch the camp film with sound${seconds ? ` (${formatDuration(seconds)})` : ""}`;

  return (
    <>
      <div
        ref={cardRef}
        className="relative mx-auto w-[min(68vw,290px)] overflow-hidden bg-black shadow-[0_30px_80px_rgba(0,0,0,0.6)] ring-1 ring-white/30 lg:w-[min(26vw,360px)]"
        style={{ aspectRatio: ratio }}
        data-testid="camp-hero-video"
      >
        {poster && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt="" fetchPriority="high" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
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
            onLoad={() => window.setTimeout(() => setPlaying(true), 700)}
            className={`pointer-events-none absolute inset-0 h-full w-full border-0 transition-opacity duration-500 ${playing ? "opacity-100" : "opacity-0"}`}
          />
        )}
        {/* One tap target over the whole card: opens the player with sound. */}
        <button
          ref={tapRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-label={label}
          className="absolute inset-0 z-10 cursor-pointer focus-visible:outline focus-visible:outline-4 focus-visible:-outline-offset-4 focus-visible:outline-white"
          data-testid="button-camp-film"
        >
          {!playing && (
            <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-white shadow-lg" aria-hidden="true">
              <span className="ml-1 h-0 w-0 border-y-[12px] border-l-[19px] border-y-transparent border-l-white" />
            </span>
          )}
        </button>
        {/* Sound switch: unmutes or mutes the film in place. With no silent loop running (reduced motion, data saving) it opens the full player instead. */}
        <button
          type="button"
          data-sound-toggle
          onClick={() => {
            if (!playing) { setOpen(true); return; }
            chosenMute.current = soundOn;
            setSound(!soundOn);
          }}
          aria-label={playing ? (soundOn ? "Mute the camp film" : "Turn the camp film sound on") : label}
          aria-pressed={playing ? soundOn : undefined}
          className="absolute bottom-3 right-3 z-20 inline-flex items-center gap-1.5 bg-black/75 px-2.5 py-2 text-[11px] font-extrabold uppercase tracking-wider text-white ring-1 ring-white/40 backdrop-blur-sm hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          data-testid="button-camp-film-sound"
        >
          {soundOn ? <><VolumeX className="h-3.5 w-3.5" aria-hidden="true" /> Mute</> : <><Volume2 className="h-3.5 w-3.5" aria-hidden="true" /> Sound on{seconds ? ` · ${formatDuration(seconds)}` : ""}</>}
        </button>
      </div>

      <FilmDialog open={open} onOpenChange={setOpen} video={video} title={title} ratio={ratio} onCloseFocus={() => tapRef.current?.focus()} />
    </>
  );
}
