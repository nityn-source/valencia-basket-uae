"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProgramCard } from "@/components/shared/ProgramCard";

export interface PathwayProgram {
  title: string;
  age: string;
  description: string;
  image: string;
  imageAlt: string;
  /** Managed-image key the alt text comes from (checked by the SEO image inventory test). */
  imageKey?: string;
  href: string;
}

interface PlayerPathwayProps {
  programs: PathwayProgram[];
  buttonLabel: string;
}

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** Screens of scrolling it takes to travel between two stages. */
const SCREENS_PER_STAGE = 0.95;
const HOPS_PER_STAGE = 4;

/** The big outlined number: the age the program starts at, else a short mark. */
function numeral(program: PathwayProgram) {
  const digits = /\d+/.exec(program.age)?.[0];
  if (digits && !/1\s*-?\s*on\s*-?\s*1/i.test(program.age)) return digits.padStart(2, "0");
  if (/1\s*-?\s*on\s*-?\s*1/i.test(program.age)) return "1:1";
  return program.title.trim().charAt(0).toUpperCase();
}

/** The short label under the progress line. */
function railLabel(program: PathwayProgram) {
  const range = /^\s*(\d+(?:\s*[-–]\s*\d+)?)/.exec(program.age)?.[1];
  if (range && !/1\s*-?\s*on\s*-?\s*1/i.test(program.age)) return `Ages ${range.replace(/\s*-\s*/, "–")}`;
  return program.title.trim().split(/\s+/)[0].replace(/[^A-Za-z0-9]/g, "") || program.title;
}

/**
 * The programs as one pinned, scroll-driven journey: the section holds the screen,
 * each program takes over in turn (photo wipes in, text slides up) and a basketball
 * dribbles along the progress line to the next stage. Everything is driven by the
 * scroll position and eased, so it never jumps. Reduced-motion visitors and very
 * short screens get the plain cards instead.
 */
export function PlayerPathway({ programs, buttonLabel }: PlayerPathwayProps) {
  const [plain, setPlain] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);
  const photoRefs = useRef<(HTMLDivElement | null)[]>([]);
  const innerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const nodeRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const ballRefs = useRef<(HTMLDivElement | null)[]>([]);
  const count = programs.length;

  // Plain cards for reduced motion and short (e.g. landscape phone) screens.
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce), (max-height: 520px)");
    const update = () => setPlain(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (plain) return;
    const wrap = wrapRef.current;
    const stage = stageRef.current;
    const rail = railRef.current;
    if (!wrap || !stage || !rail) return;

    let mobile = false;
    let railLeft = 28;
    let railWidth = 0;
    let target = 0;
    let current = -1;
    let last = performance.now();
    let frame = 0;
    let visible = true;
    const history: { x: number; y: number; transform: string }[] = [];

    const measure = () => {
      mobile = window.innerWidth <= 860;
      railLeft = mobile ? 22 : 28;
      railWidth = Math.max(0, rail.clientWidth - railLeft * 2);
      nodeRefs.current.forEach((node, index) => {
        if (node) node.style.left = `${railLeft + (railWidth * index) / Math.max(1, count - 1)}px`;
      });
    };

    const apply = (progress: number) => {
      const stages = count - 1;
      const s = progress * stages;

      photoRefs.current.forEach((photo, index) => {
        if (!photo) return;
        const reveal = index === 0 ? 1 : ease(clamp((s - (index - 1) - 0.5) / 0.5));
        photo.style.clipPath = `inset(0 0 0 ${(1 - reveal) * 100}%)`;
        const inner = innerRefs.current[index];
        if (inner) {
          const local = s - index;
          inner.style.transform = `translate3d(${clamp(local, -1, 1) * -4 + (index === 0 ? 0 : (1 - reveal) * 8)}%,0,0) scale(${1.08 - 0.04 * clamp(1 - Math.abs(local), 0, 1)})`;
        }
      });

      textRefs.current.forEach((block, index) => {
        if (!block) return;
        // Fade out fully before the next one fades in, so two never overlap.
        const entering = index === 0 ? 1 : ease(clamp((s - index + 0.4) / 0.35));
        const leaving = index === count - 1 ? 0 : ease(clamp((s - index - 0.35) / 0.25));
        const opacity = entering * (1 - leaving);
        block.style.opacity = opacity.toFixed(3);
        // Faded-out stages stay in the page (and in the HTML crawlers read) but can't be focused or tabbed to.
        block.inert = opacity < 0.5;
        block.style.transform = `translate3d(0,${(1 - entering) * 36 - leaving * 36}px,0)${mobile ? "" : " translateY(-50%)"}`;
      });

      const x = railLeft + railWidth * (s / stages);
      const phase = s * HOPS_PER_STAGE * Math.PI;
      const hop = Math.abs(Math.sin(phase));
      const ground = mobile ? 48 : 62;
      const y = ground - hop * (mobile ? 34 : 50);
      const squash = Math.pow(1 - hop, 5) * 0.22;
      const transform = `scale(${1 + squash},${1 - squash}) rotate(${s * 540}deg)`;
      const [ball, ...ghosts] = ballRefs.current;
      if (ball) ball.style.transform = `translate3d(${x}px,${y}px,0) ${transform}`;
      history.unshift({ x, y, transform });
      if (history.length > 40) history.pop();
      ghosts.forEach((ghost, index) => {
        const point = history[(index + 1) * 5] ?? history[history.length - 1];
        if (ghost && point) ghost.style.transform = `translate3d(${point.x}px,${point.y}px,0) ${point.transform}`;
      });
      const shadow = shadowRef.current;
      if (shadow) {
        shadow.style.transform = `translate3d(${x}px,0,0) scale(${1 - 0.45 * hop},${1 - 0.3 * hop})`;
        shadow.style.opacity = (1 - 0.6 * hop).toFixed(2);
      }
      if (fillRef.current) fillRef.current.style.width = `${railWidth * (s / stages)}px`;
      nodeRefs.current.forEach((node, index) => {
        if (!node) return;
        const on = s >= index - 0.04;
        node.dataset.on = on ? "true" : "false";
        if (on && index === Math.round(s)) node.setAttribute("aria-current", "step");
        else node.removeAttribute("aria-current");
      });
      if (counterRef.current) counterRef.current.textContent = `${String(Math.round(s) + 1).padStart(2, "0")} / ${String(count).padStart(2, "0")}`;
      if (hintRef.current) hintRef.current.style.opacity = progress > 0.02 ? "0" : "1";
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (!visible) {
        last = now;
        return;
      }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const rect = wrap.getBoundingClientRect();
      const distance = Math.max(1, wrap.offsetHeight - stage.offsetHeight);
      target = clamp(-rect.top / distance);
      // Start exactly where the page is, then ease towards it.
      current = current < 0 ? target : current + (target - current) * (1 - Math.pow(0.0008, dt));
      if (Math.abs(target - current) < 0.00002) current = target;
      apply(current);
    };

    measure();
    apply(0);
    const observer = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), { rootMargin: "200px" });
    observer.observe(wrap);
    window.addEventListener("resize", measure);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [plain, count]);

  const jumpTo = (index: number) => {
    const wrap = wrapRef.current;
    const stage = stageRef.current;
    if (!wrap || !stage) return;
    const distance = wrap.offsetHeight - stage.offsetHeight;
    const top = wrap.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + (distance * index) / Math.max(1, count - 1), behavior: "smooth" });
  };

  if (plain) {
    return (
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => (
            <ProgramCard key={program.href} title={program.title} age={program.age} description={program.description} image={program.image} imageAlt={program.imageAlt} href={program.href} buttonLabel={buttonLabel} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative" style={{ height: `${(count - 1) * SCREENS_PER_STAGE * 100 + 100}svh` }} data-testid="player-pathway">
      <div
        ref={stageRef}
        className="sticky top-0 mx-auto grid h-[100svh] max-w-[1240px] grid-cols-1 grid-rows-[40%_1fr_auto] gap-y-3 overflow-hidden px-4 pb-20 pt-[76px] md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:grid-rows-[1fr_auto] md:gap-x-10 md:gap-y-0 md:px-5 md:pb-6 md:pt-[84px]"
      >
        <div className="relative row-start-2 min-h-0 self-stretch md:row-start-1 md:min-h-[380px] md:self-center">
          {programs.map((program, index) => (
            <div
              key={program.href}
              ref={(node) => {
                textRefs.current[index] = node;
              }}
              className="absolute inset-x-0 top-0 will-change-[transform,opacity] md:top-1/2"
              inert={index !== 0}
              style={{ opacity: index === 0 ? 1 : 0 }}
            >
              <div aria-hidden="true" className="mb-1 text-[92px] font-black leading-[0.82] tracking-[-0.07em] text-transparent [-webkit-text-stroke:1.6px_#16130F] md:mb-2.5 md:text-[clamp(110px,15vw,210px)] md:[-webkit-text-stroke-width:2px]">
                {numeral(program)}
              </div>
              <span className="inline-block bg-primary px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">{program.age}</span>
              <h3 className="mb-2 mt-2.5 text-[28px] font-black uppercase leading-[0.95] tracking-tight text-black md:mb-2.5 md:mt-3 md:text-[clamp(32px,4vw,52px)]">
                <Link href={program.href} className="hover:text-primary transition-colors">
                  {program.title}
                </Link>
              </h3>
              <p className="max-w-[440px] text-[13.5px] leading-snug text-gray-600 md:text-[17px] md:leading-relaxed">{program.description}</p>
              <Link href={program.href} className="mt-3 inline-flex min-h-[44px] items-center gap-2 bg-primary px-5 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-orange-600 md:mt-5 md:min-h-[46px]">
                {buttonLabel}
                <span className="sr-only"> about {program.title}</span> <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          ))}
        </div>

        <div className="relative row-start-1 overflow-hidden rounded-2xl bg-gray-100 md:col-start-2">
          {programs.map((program, index) => (
            <div
              key={program.href}
              ref={(node) => {
                photoRefs.current[index] = node;
              }}
              className="absolute inset-0 will-change-[clip-path]"
              style={{ zIndex: index, clipPath: index === 0 ? "inset(0 0 0 0%)" : "inset(0 0 0 100%)" }}
            >
              <div
                ref={(node) => {
                  innerRefs.current[index] = node;
                }}
                className="absolute -inset-x-[10%] -inset-y-[6%] will-change-transform"
              >
                <Image src={program.image} alt={program.imageAlt} fill sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" priority={index === 0} />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
            </div>
          ))}
          <span ref={counterRef} aria-hidden="true" className="absolute right-4 top-3.5 z-10 text-[13px] font-extrabold tracking-[0.12em] text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.5)]">
            01 / {String(count).padStart(2, "0")}
          </span>
        </div>

        <div ref={railRef} className="relative col-span-full mt-0 h-24 md:mt-3.5 md:h-[118px]">
          <div className="absolute inset-x-[22px] top-12 h-1 rounded-full bg-[#e6e1da] md:inset-x-[28px] md:top-[62px]">
            <div ref={fillRef} className="h-full w-0 rounded-full bg-primary" />
          </div>
          <div ref={shadowRef} className="absolute left-0 top-[46px] -ml-5 h-2.5 w-10 rounded-full bg-[#16130F]/30 blur-[2px] md:top-[60px]" aria-hidden="true" />
          {programs.map((program, index) => (
            <button
              key={program.href}
              type="button"
              ref={(node) => {
                nodeRefs.current[index] = node;
              }}
              onClick={() => jumpTo(index)}
              aria-label={`${railLabel(program)}: ${program.title}`}
              className="group absolute top-[50px] h-0 w-0 md:top-[64px]"
            >
              <span className="absolute -left-[9px] -top-[9px] h-[18px] w-[18px] rounded-full border-4 border-[#d4cec5] bg-white transition-colors group-data-[on=true]:border-primary group-data-[on=true]:bg-primary" />
              <span
                className={`absolute top-[15px] whitespace-nowrap text-[9.5px] font-extrabold uppercase tracking-[0.04em] text-[#6b6258] transition-colors group-data-[on=true]:text-black md:top-[18px] md:text-[11px] md:tracking-[0.08em] ${
                  index === 0 ? "-left-2" : index === count - 1 ? "-right-2" : "left-1/2 -translate-x-1/2"
                }`}
              >
                {railLabel(program)}
              </span>
            </button>
          ))}
          {[0, 1, 2, 3].map((n) => (
            <div
              key={n}
              ref={(node) => {
                ballRefs.current[n] = node;
              }}
              aria-hidden="true"
              className={`pointer-events-none absolute left-0 top-0 -ml-[19px] -mt-[19px] h-[38px] w-[38px] will-change-transform md:-ml-[22px] md:-mt-[22px] md:h-11 md:w-11 ${n === 0 ? "z-[4]" : "z-[3]"}`}
              style={{ opacity: n === 0 ? 1 : [0, 0.22, 0.12, 0.06][n] }}
            >
              <svg viewBox="0 0 40 40" className="block h-full w-full">
                <circle cx="20" cy="20" r="18" fill="#E8722C" stroke="#16130F" strokeWidth="2" />
                <path d="M20 2v36M2 20h36M7 7c8 6 8 20 0 26M33 7c-8 6-8 20 0 26" fill="none" stroke="#16130F" strokeWidth="1.6" />
              </svg>
            </div>
          ))}
        </div>

        <div ref={hintRef} aria-hidden="true" className="pointer-events-none absolute bottom-[112px] left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#6b6258] transition-opacity duration-500 md:bottom-[132px]">
          Scroll
          <span className="h-[22px] w-0.5 bg-gradient-to-b from-primary to-transparent" />
        </div>
      </div>
    </div>
  );
}
