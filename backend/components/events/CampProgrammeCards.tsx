"use client";

import { Fragment, useEffect, useRef } from "react";
import { CalendarDays, MapPin, Clock, ArrowRight, Info } from "lucide-react";
import { chooseCamp, scrollToSection } from "@/lib/campPick";
import { compactDates } from "@/lib/campDays";

export interface CampCard {
  id: string;
  weekLabel: string;
  name: string;
  tagline: string;
  venue: string;
  dates: string;
  timeLines: string[];
  fee: string;
  /** Id of the section further down with this week's full drill list, if there is one. */
  infoTarget?: string;
}

export interface CampBundle {
  name: string;
  dates: string;
  fee: string;
  note: string;
}

/** Height of each card's header strip: the part that stays visible when the next card stacks over it. */
const HEAD = 64;

function Dates({ text }: { text: string }) {
  return (
    <>
      <span className="sm:hidden">{compactDates(text)}</span>
      <span className="hidden sm:inline">{text}</span>
    </>
  );
}

/** Scroll distance from one card sticking to the next, as a share of the screen height (the same for every card). */
const STEP_SVH = 62;

/**
 * The camp cards as a vertical stack: each card sticks near the top as you scroll and the next one slides up over it,
 * leaving every card's header (week, camp name, dates) showing so they can still be compared. The best-value
 * "both weeks" option comes last. Each whole card is a button that picks that camp in the registration form.
 */
export function CampProgrammeCards({
  cards,
  bundle,
  introTitle,
  introText,
  openFor,
  registerOpen,
}: {
  cards: CampCard[];
  bundle: CampBundle | null;
  /** The section heading: stays pinned at the top while the cards stack up beneath it. */
  introTitle: string;
  /** The paragraph under it: scrolls away (fading) as the cards arrive. */
  introText: string;
  openFor: string;
  registerOpen: boolean;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const paraRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const measure = () => {
      // The cards pin below the heading, so they start at its bottom edge.
      const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--navbar-height")) || 72;
      list.style.setProperty("--camp-top", `${nav + (headRef.current?.offsetHeight ?? 0) + 12}px`);
      // Even pacing: the distance from one card sticking to the next is the same whatever the card's height.
      // The gaps are spacer elements (not margins or padding), because a sticky card can only stay pinned while the
      // space around it is inside the list's content area.
      const step = (STEP_SVH / 100) * window.innerHeight;
      const slots = Array.from(list.querySelectorAll<HTMLElement>(":scope > [data-slot]"));
      const gaps = Array.from(list.querySelectorAll<HTMLElement>(":scope > [data-gap]"));
      slots.forEach((slot, i) => {
        gaps[i].style.height = `${i < slots.length - 1 ? Math.max(24, step - slot.offsetHeight) : Math.round(step * 0.45)}px`;
      });
    };
    const update = () => {
      // The paragraph fades out as it slides up under the pinned heading, i.e. as the cards arrive.
      const para = paraRef.current;
      const head = headRef.current;
      if (para && head) {
        // Share of the paragraph still below the heading: 1 while it is fully in view, 0 once it has slid underneath.
        const box = para.getBoundingClientRect();
        const visible = (box.bottom - head.getBoundingClientRect().bottom) / Math.max(1, box.height);
        para.style.opacity = calm ? "1" : String(Math.min(1, Math.max(0, visible * 1.4)));
      }
      if (calm) return;
      const slots = Array.from(list.querySelectorAll<HTMLElement>(":scope > [data-slot]"));
      slots.forEach((slot, i) => {
        const next = slots[i + 1];
        const body = slot.querySelector<HTMLElement>("[data-card-body]");
        if (!body || !next) return;
        // How far the next card has climbed over this one (0 = not touching, 1 = covering all but the header).
        const top = slot.getBoundingClientRect().top;
        const stuck = top <= parseFloat(getComputedStyle(slot).top) + 1;
        const room = Math.max(1, body.offsetHeight - HEAD);
        const covered = Math.min(1, Math.max(0, (top + body.offsetHeight - next.getBoundingClientRect().top) / room));
        body.style.transform = stuck && covered > 0 ? `scale(${(1 - 0.03 * covered).toFixed(4)})` : "";
      });
    };
    measure();
    update();
    const settle = window.setTimeout(() => {
      measure();
      update();
    }, 600);
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    const onResize = () => {
      measure();
      onScroll();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(settle);
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Each card sticks a little lower than the one before, so every header stays readable.
  const stickTop = (i: number) => `calc(var(--camp-top, calc(var(--navbar-height, 72px) + 80px)) + ${i * HEAD}px)`;

  const shell = (id: string, label: string, className: string, children: React.ReactNode) =>
    registerOpen ? (
      <a
        href="#register"
        onClick={(e) => {
          e.preventDefault();
          chooseCamp(id);
        }}
        aria-label={`${label}. Choose this camp and go to the registration form`}
        data-testid={`camp-card-${id}`}
        data-card-body=""
        className={`group block cursor-pointer origin-top overflow-hidden will-change-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 ${className}`}
      >
        {children}
      </a>
    ) : (
      <div data-card-body="" className={`origin-top overflow-hidden ${className}`}>{children}</div>
    );

  const cta = (tone: "dark" | "light") =>
    registerOpen && (
      <span
        className={`mt-3 inline-flex items-center gap-2 px-6 py-3 text-xs font-extrabold uppercase tracking-widest transition-colors md:mt-4 ${
          tone === "dark" ? "bg-black text-white group-hover:bg-primary" : "bg-black text-white group-hover:bg-white group-hover:text-black"
        }`}
      >
        Register <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" aria-hidden="true" />
      </span>
    );

  const renderWeek = (p: CampCard, i: number) => (
    <div key={p.id} data-slot="" className="sticky" style={{ top: stickTop(i), zIndex: i + 1 }}>
      {p.infoTarget && (
        // A sibling of the card link (not inside it), so it can be clicked on its own, also while the card is stacked.
        <a
          href={`#${p.infoTarget}`}
          onClick={(e) => {
            e.preventDefault();
            scrollToSection(p.infoTarget!);
          }}
          aria-label={`What is in ${p.name}: see the full week`}
          data-testid={`camp-info-${p.id}`}
                    className="absolute right-3 top-[14px] z-10 inline-flex h-9 items-center gap-1.5 border-2 border-black bg-white px-2.5 text-[11px] font-extrabold uppercase tracking-widest text-black transition-colors hover:border-primary hover:bg-primary hover:text-white sm:px-3 md:right-6"
        >
          <Info className="h-4 w-4" aria-hidden="true" /> <span className="max-sm:sr-only">Info</span>
        </a>
      )}
      {shell(
        p.id,
        [p.weekLabel, p.name, p.dates].filter(Boolean).join(", "),
        "relative border-2 border-black bg-white transition-shadow duration-300 group-hover:shadow-xl",
        <>
          <div className={`flex items-center justify-between gap-3 border-b-2 border-black px-5 md:px-9 ${p.infoTarget ? "pr-[56px] sm:pr-[92px] md:pr-[130px]" : ""}`} style={{ height: HEAD }}>
            <div className="min-w-0">
              {p.weekLabel && <div className="text-[10px] font-extrabold uppercase leading-none tracking-[0.2em] text-primary md:text-xs">{p.weekLabel}</div>}
              <div className="truncate text-xl font-black uppercase leading-tight md:text-2xl">{p.name}</div>
            </div>
            {p.dates && (
              <div className="flex shrink-0 items-center gap-1.5 text-right text-[11px] font-bold leading-tight md:text-sm">
                <CalendarDays className="hidden h-4 w-4 text-primary sm:block" aria-hidden="true" />
                <Dates text={p.dates} />
              </div>
            )}
          </div>
          <div className="relative p-4 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center md:gap-8 md:p-8">
            <span aria-hidden="true" className="pointer-events-none absolute -top-6 right-3 text-[130px] font-black leading-none text-primary opacity-10 md:-top-8 md:text-[190px]">{i + 1}</span>
            <div className="relative">
              {p.tagline && <p className="text-lg font-black uppercase leading-tight md:text-3xl">{p.tagline}</p>}
            </div>
            <div className="relative mt-3 md:mt-0">
              <div className="space-y-1 text-sm font-bold md:space-y-1.5 md:text-[15px]">
                {p.venue && <div className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{p.venue}</div>}
                {p.timeLines.map((line) => (
                  <div key={line} className="flex gap-2"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{line}</div>
                ))}
              </div>
              {p.fee && <div className="mt-3 text-2xl font-black text-primary md:mt-4 md:text-3xl">{p.fee}</div>}
              {cta("dark")}
            </div>
          </div>
        </>,
      )}
    </div>
  );

  const renderBundle = (b: CampBundle) => {
    const i = cards.length;
    return (
      <div key="both" data-slot="" className="sticky" style={{ top: stickTop(i), zIndex: i + 1 }} data-testid="camp-bundle-card">
        {shell(
          "both",
          [b.name, b.dates].filter(Boolean).join(", "),
          "relative border-2 border-primary bg-primary text-white transition-shadow duration-300 group-hover:shadow-xl",
          <>
            <div className="flex items-center justify-between gap-3 border-b-2 border-white/30 px-5 md:px-9" style={{ height: HEAD }}>
              <div className="min-w-0">
                <div className="text-[10px] font-extrabold uppercase leading-none tracking-[0.2em] text-black/70 md:text-xs">Week 1 + Week 2</div>
                <div className="truncate text-xl font-black uppercase leading-tight md:text-2xl">{b.name}</div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {b.dates && (
                  <div className="flex items-center gap-1.5 text-right text-[11px] font-bold leading-tight md:text-sm">
                    <CalendarDays className="hidden h-4 w-4 sm:block" aria-hidden="true" />
                    <Dates text={b.dates} />
                  </div>
                )}
                <span className="hidden bg-black px-3 py-1.5 text-[11px] font-black tracking-widest text-white md:inline">BEST VALUE</span>
              </div>
            </div>
            <div className="p-4 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center md:gap-8 md:p-8">
              <div>
                <span className="mb-2 inline-block bg-black px-3 py-1.5 text-[11px] font-black tracking-widest text-white md:hidden">BEST VALUE</span>
                {b.note && <p className="text-lg font-black uppercase leading-tight md:text-3xl">{b.note}</p>}
              </div>
              <div className="mt-3 md:mt-0">
                <div className="text-2xl font-black md:text-3xl">{b.fee}</div>
                {cta("light")}
              </div>
            </div>
          </>,
        )}
      </div>
    );
  };

  return (
    <section className="bg-[#f6f1e8] px-4 pb-8 pt-10 md:px-10 md:pt-16 lg:px-16">
      <div className="mx-auto max-w-5xl">
        {/* The heading stays put while everything else scrolls under it. */}
        <div ref={headRef} className="sticky top-[var(--navbar-height,72px)] z-30 -mx-4 bg-[#f6f1e8] px-4 pb-3 pt-3 md:-mx-10 md:px-10 lg:-mx-16 lg:px-16">
          <h2 className="mx-auto max-w-5xl text-2xl font-black uppercase leading-none tracking-tight sm:text-3xl md:text-5xl">{introTitle}</h2>
        </div>
        {introText && (
          <p ref={paraRef} className="mb-10 max-w-3xl text-base leading-relaxed text-[#4a4339] will-change-[opacity] md:mb-14 md:text-lg">
            {introText}
          </p>
        )}
        <div ref={listRef} className="flex flex-col">
          {cards.map((p, i) => (
            <Fragment key={p.id}>
              {renderWeek(p, i)}
              <div data-gap="" aria-hidden="true" />
            </Fragment>
          ))}
          {bundle && (
            <>
              {renderBundle(bundle)}
              <div data-gap="" aria-hidden="true" />
            </>
          )}
        </div>
      </div>
      {openFor && <p className="mt-5 text-center text-sm font-extrabold uppercase tracking-widest">{openFor}</p>}
    </section>
  );
}
