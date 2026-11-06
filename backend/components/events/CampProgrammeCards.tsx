"use client";

import { useEffect, useRef } from "react";
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

/**
 * The camp cards as a vertical stack: each card sticks near the top as you scroll and the next one slides up over it,
 * leaving every card's header (week, camp name, dates) showing so they can still be compared. The best-value
 * "both weeks" option comes last. Each whole card is a button that picks that camp in the registration form.
 */
export function CampProgrammeCards({ cards, bundle, openFor, registerOpen }: { cards: CampCard[]; bundle: CampBundle | null; openFor: string; registerOpen: boolean }) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const update = () => {
      const slots = Array.from(list.children) as HTMLElement[];
      slots.forEach((slot, i) => {
        const inner = slot.firstElementChild as HTMLElement | null;
        const next = slots[i + 1];
        if (!inner || !next) return;
        // How far the next card has climbed over this one (0 = not touching, 1 = covering all but the header).
        const stuckTop = slot.getBoundingClientRect().top;
        const room = Math.max(1, inner.offsetHeight - HEAD);
        const covered = Math.min(1, Math.max(0, (stuckTop + inner.offsetHeight - next.getBoundingClientRect().top) / room));
        const stuck = stuckTop <= parseFloat(getComputedStyle(slot).top) + 1;
        const p = stuck ? covered : 0;
        inner.style.transform = p > 0 ? `scale(${(1 - 0.03 * p).toFixed(4)})` : "";
      });
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Each card sticks one header lower than the one before, so every header stays readable.
  const stickTop = (i: number) => `calc(var(--navbar-height, 72px) + 16px + ${i * HEAD}px)`;

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
        className={`group block cursor-pointer origin-top overflow-hidden will-change-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 ${className}`}
      >
        {children}
      </a>
    ) : (
      <div className={`origin-top overflow-hidden ${className}`}>{children}</div>
    );

  const cta = (tone: "dark" | "light") =>
    registerOpen && (
      <span
        className={`mt-4 inline-flex items-center gap-2 px-6 py-3 text-xs font-extrabold uppercase tracking-widest transition-colors ${
          tone === "dark" ? "bg-black text-white group-hover:bg-primary" : "bg-black text-white group-hover:bg-white group-hover:text-black"
        }`}
      >
        Register <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" aria-hidden="true" />
      </span>
    );

  return (
    <section className="px-4 pb-4 pt-12 md:px-10 lg:px-16">
      {/* The gaps are the scroll runway: each card stays pinned while the next one climbs over it. */}
      <div ref={listRef} className="mx-auto flex max-w-5xl flex-col gap-[24vh] pb-[10vh] md:gap-[28vh]">
        {cards.map((p, i) => (
          <div key={p.id} className="sticky" style={{ top: stickTop(i), zIndex: i + 1 }}>
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
                className="absolute right-3 top-[14px] z-10 inline-flex h-9 items-center gap-1.5 border-2 border-black bg-white px-3 text-[11px] font-extrabold uppercase tracking-widest text-black transition-colors hover:border-primary hover:bg-primary hover:text-white md:right-6"
              >
                <Info className="h-4 w-4" aria-hidden="true" /> Info
              </a>
            )}
            {shell(
              p.id,
              [p.weekLabel, p.name, p.dates].filter(Boolean).join(", "),
              "relative border-2 border-black bg-white transition-shadow duration-300 group-hover:shadow-xl",
              <>
                <div className={`flex items-center justify-between gap-3 border-b-2 border-black px-5 md:px-9 ${p.infoTarget ? "pr-[92px] md:pr-[130px]" : ""}`} style={{ height: HEAD }}>
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
                <div className="relative p-6 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center md:gap-8 md:p-9">
                  <span aria-hidden="true" className="pointer-events-none absolute -top-6 right-3 text-[150px] font-black leading-none text-primary opacity-10 md:-top-8 md:text-[200px]">{i + 1}</span>
                  <div className="relative">
                    {p.tagline && <p className="text-2xl font-black uppercase leading-tight md:text-3xl">{p.tagline}</p>}
                  </div>
                  <div className="relative mt-4 md:mt-0">
                    <div className="space-y-1.5 text-[15px] font-bold">
                      {p.venue && <div className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{p.venue}</div>}
                      {p.timeLines.map((line) => (
                        <div key={line} className="flex gap-2"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{line}</div>
                      ))}
                    </div>
                    {p.fee && <div className="mt-4 text-3xl font-black text-primary">{p.fee}</div>}
                    {cta("dark")}
                  </div>
                </div>
              </>,
            )}
          </div>
        ))}
        {bundle && (
          <div className="sticky" style={{ top: stickTop(cards.length), zIndex: cards.length + 1 }} data-testid="camp-bundle-card">
            {shell(
              "both",
              [bundle.name, bundle.dates].filter(Boolean).join(", "),
              "relative border-2 border-primary bg-primary text-white transition-shadow duration-300 group-hover:shadow-xl",
              <>
                <div className="flex items-center justify-between gap-3 border-b-2 border-white/30 px-5 md:px-9" style={{ height: HEAD }}>
                  <div className="min-w-0">
                    <div className="text-[10px] font-extrabold uppercase leading-none tracking-[0.2em] text-black/70 md:text-xs">Week 1 + Week 2</div>
                    <div className="truncate text-xl font-black uppercase leading-tight md:text-2xl">{bundle.name}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {bundle.dates && (
                      <div className="flex items-center gap-1.5 text-right text-[11px] font-bold leading-tight md:text-sm">
                        <CalendarDays className="hidden h-4 w-4 sm:block" aria-hidden="true" />
                        <Dates text={bundle.dates} />
                      </div>
                    )}
                    <span className="hidden bg-black px-3 py-1.5 text-[11px] font-black tracking-widest text-white md:inline">BEST VALUE</span>
                  </div>
                </div>
                <div className="p-6 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center md:gap-8 md:p-9">
                  <div>
                    <span className="mb-2 inline-block bg-black px-3 py-1.5 text-[11px] font-black tracking-widest text-white md:hidden">BEST VALUE</span>
                    {bundle.note && <p className="text-2xl font-black uppercase leading-tight md:text-3xl">{bundle.note}</p>}
                  </div>
                  <div className="mt-4 md:mt-0">
                    <div className="text-3xl font-black">{bundle.fee}</div>
                    {cta("light")}
                  </div>
                </div>
              </>,
            )}
          </div>
        )}
      </div>
      {openFor && <p className="mt-5 text-center text-sm font-extrabold uppercase tracking-widest">{openFor}</p>}
    </section>
  );
}
