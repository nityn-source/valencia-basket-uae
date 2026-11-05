"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { wipeNavigate } from "@/components/shared/PageWipe";
import { SectionHeader } from "@/components/shared/SectionHeader";
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
  /** Section heading, kept pinned at the top while the programs change. */
  heading?: { eyebrow?: string; title: string; description?: string };
}

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** Screens of scrolling it takes to travel between two stages. */
const SCREENS_PER_STAGE = 0.95;
const HOPS_PER_STAGE = 4;

/** The big headline mark: the age range ("4–6"), else "1:1" or the program's first letter. */
function heroMark(program: PathwayProgram) {
  if (/1\s*-?\s*on\s*-?\s*1/i.test(program.age)) return { text: "1:1", tag: program.age };
  const m = /^\s*(\d+)\s*(?:[-–]\s*(\d+)|(\+))?\s*(years?|yrs?)?\s*(old)?\s*$/i.exec(program.age);
  if (m) {
    const text = m[2] ? `${m[1]}–${m[2]}` : m[3] ? `${m[1]}+` : m[1];
    return { text, tag: "Years old" };
  }
  const digits = /\d+(?:\s*[-–]\s*\d+)?\+?/.exec(program.age)?.[0];
  if (digits) return { text: digits.replace(/\s*-\s*/, "–"), tag: program.age };
  return { text: railLabel(program).split(" ")[0], tag: program.age };
}

/** The short label under the progress line: the program's name without brackets or "/ Select" tails. */
function railLabel(program: PathwayProgram) {
  const name = program.title.replace(/\(.*?\)/g, "").split("/")[0].replace(/\s+/g, " ").trim();
  return name || program.title;
}

/**
 * The programs as one pinned, scroll-driven journey: the section holds the screen,
 * each program takes over in turn (photo wipes in, text slides up) and a basketball
 * dribbles along the progress line to the next stage. Everything is driven by the
 * scroll position and eased, so it never jumps. Reduced-motion visitors and very
 * short screens get the plain cards instead.
 */
export function PlayerPathway({ programs, buttonLabel, heading }: PlayerPathwayProps) {
  const [plain, setPlain] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);
  const photoRefs = useRef<(HTMLDivElement | null)[]>([]);
  const innerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const nodeRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const ballRefs = useRef<(HTMLDivElement | null)[]>([]);
  const count = programs.length;
  const router = useRouter();
  const toAllPrograms = (e: React.MouseEvent) => wipeNavigate(e, router, "/programs", "Programs");

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
          inner.style.transform = `translate3d(${clamp(local, -1, 1) * -1.5 + (index === 0 ? 0 : (1 - reveal) * 4)}%,0,0) scale(${1.04 - 0.02 * clamp(1 - Math.abs(local), 0, 1)})`;
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

    // Magnetic stages: once scrolling pauses between two programs, pull to the next one in
    // the direction of travel (or back, if the nudge was tiny) instead of resting mid-wipe.
    const stages = count - 1;
    const rawStage = () => (-wrap.getBoundingClientRect().top / Math.max(1, wrap.offsetHeight - stage.offsetHeight)) * stages;
    let base = Math.round(clamp(rawStage() / stages) * stages);
    let idleTimer = 0;
    let snapFrame = 0;
    let snapping = false;

    const stopSnap = () => {
      cancelAnimationFrame(snapFrame);
      snapping = false;
    };

    let leaving = false;
    const animateTo = (goal: number, duration: number, done: () => void) => {
      const from = window.scrollY;
      const started = performance.now();
      snapping = true;
      const step = (now: number) => {
        const t = clamp((now - started) / duration);
        window.scrollTo({ top: from + (goal - from) * (1 - Math.pow(1 - t, 3)), behavior: "instant" });
        if (t < 1) snapFrame = requestAnimationFrame(step);
        else {
          snapping = false;
          leaving = false;
          done();
        }
      };
      snapFrame = requestAnimationFrame(step);
    };

    const snapTo = (index: number) => {
      const distance = wrap.offsetHeight - stage.offsetHeight;
      const goal = wrap.getBoundingClientRect().top + window.scrollY + (distance * index) / Math.max(1, stages);
      animateTo(goal, 600, () => {
        base = index;
      });
    };

    // Carry on past the whole pinned stretch instead of stepping through it.
    const leave = (dir: number) => {
      const navbar = document.querySelector("header")?.getBoundingClientRect().height ?? 0;
      const wrapTop = wrap.getBoundingClientRect().top + window.scrollY;
      const goal = dir > 0 ? wrapTop + wrap.offsetHeight - navbar : Math.max(0, wrapTop - window.innerHeight * 0.5);
      leaving = true;
      animateTo(goal, 900, () => {
        base = dir > 0 ? stages : 0;
      });
    };

    // Three quick swipes in a row mean "I'm just trying to get past this": skip the rest.
    let recent: { t: number; dir: number }[] = [];
    const advance = (dir: number) => {
      const now = performance.now();
      const last = recent[recent.length - 1];
      if (last && (last.dir !== dir || now - last.t > 1100)) recent = [];
      if (recent.length >= 2) {
        recent = [];
        leave(dir);
        return;
      }
      recent.push({ t: now, dir });
      snapTo(base + dir);
    };

    const settle = () => {
      if (snapping || !visible) return;
      const s = rawStage();
      // Above or below the pinned stretch: nothing to snap to, the page scrolls on as normal.
      if (s <= 0.001 || s >= stages - 0.001) {
        base = s <= 0 ? 0 : stages;
        return;
      }
      const delta = s - base;
      if (Math.abs(delta) < 0.12) return snapTo(base);
      const index = delta > 0 ? Math.ceil(s - 0.12) : Math.floor(s + 0.12);
      snapTo(Math.min(stages, Math.max(0, index)));
    };

    const onScroll = () => {
      if (snapping) return;
      clearTimeout(idleTimer);
      idleTimer = window.setTimeout(settle, 130);
    };
    const cancelLeave = () => {
      if (leaving) {
        stopSnap();
        leaving = false;
        base = Math.round(clamp(rawStage() / stages) * stages);
      }
    };
    const onKey = () => {
      if (snapping) {
        stopSnap();
        base = Math.round(clamp(rawStage() / stages) * stages);
      }
    };

    // One swipe (or wheel flick) while the stage is pinned = exactly one program forward or back.
    // At the first and last program the swipe is left alone so the page scrolls on as normal.
    const canMove = (dir: number) => {
      const s = rawStage();
      if (s < -0.02 || s > stages + 0.02) return false;
      return dir > 0 ? base < stages : base > 0;
    };

    let lastWheel = 0;
    let wheelOwned = false;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const fresh = e.timeStamp - lastWheel > 120;
      lastWheel = e.timeStamp;
      if (fresh) {
        wheelOwned = false;
        cancelLeave();
      }
      if (fresh && !snapping) {
        const dir = Math.sign(e.deltaY);
        if (dir && Math.abs(e.deltaY) >= 2 && canMove(dir)) {
          wheelOwned = true;
          e.preventDefault();
          advance(dir);
        }
      } else if (wheelOwned || (snapping && rawStage() > -0.02 && rawStage() < stages + 0.02)) {
        // Trackpad momentum from the same flick: swallow it so it can't drag the next stage along.
        e.preventDefault();
      }
    };

    let touchY = 0;
    let touchX = 0;
    let touchDir = 0;
    let touchState: "idle" | "undecided" | "owned" | "native" = "idle";
    let touchFired = false;
    const onTouchStart = (e: TouchEvent) => {
      cancelLeave();
      touchState = snapping ? "native" : "undecided";
      touchFired = false;
      touchDir = 0;
      touchY = e.touches[0].clientY;
      touchX = e.touches[0].clientX;
    };
    const onTouchMove = (e: TouchEvent) => {
      const dy = touchY - e.touches[0].clientY;
      const dx = touchX - e.touches[0].clientX;
      if (touchState === "undecided") {
        if (Math.abs(dy) < 1 && Math.abs(dx) < 1) return;
        touchDir = Math.sign(dy);
        touchState = Math.abs(dy) >= Math.abs(dx) && touchDir !== 0 && canMove(touchDir) ? "owned" : "native";
      }
      if (touchState !== "owned") return;
      if (e.cancelable) e.preventDefault();
      if (!touchFired && Math.abs(dy) >= 28) {
        touchFired = true;
        advance(touchDir);
      }
    };
    const onTouchEnd = () => {
      if (touchState === "owned" && !touchFired) advance(touchDir);
      touchState = "idle";
    };

    measure();
    apply(0);
    const observer = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), { rootMargin: "200px" });
    observer.observe(wrap);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKey);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      stopSnap();
      clearTimeout(idleTimer);
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("keydown", onKey);
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
        {heading && <SectionHeader title={heading.title} subtitle={heading.eyebrow} description={heading.description} className="mb-4 md:mb-6" />}
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
        className="sticky top-0 mx-auto grid h-[100svh] max-w-[1240px] grid-cols-1 grid-rows-[40%_1fr_auto] gap-y-3 overflow-hidden px-4 pb-20 pt-[178px] md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:grid-rows-[1fr_auto] md:gap-x-10 md:gap-y-0 md:px-5 md:pb-6 md:pt-[186px] md:[@media(max-height:820px)]:pt-[176px]"
      >
        {heading && (
          <div className="absolute inset-x-4 top-[78px] z-10 md:inset-x-5 md:top-[98px]">
            {heading.eyebrow && <span className="block text-[11px] font-bold uppercase tracking-widest text-primary md:text-sm">{heading.eyebrow}</span>}
            <h2 className="text-[26px] font-black uppercase leading-none tracking-tight text-black md:mt-1 md:text-[40px] md:[@media(max-height:820px)]:text-[34px]">{heading.title}</h2>
            {heading.description && <p className="mt-1.5 block max-w-[640px] text-[12.5px] leading-snug text-gray-600 md:mt-2 md:text-[15px]">{heading.description}</p>}
          </div>
        )}
        <div className="relative row-start-2 min-h-0 self-stretch md:row-start-1 md:min-h-[380px] md:[@media(max-height:820px)]:min-h-[330px] md:self-center">
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
              <div aria-hidden="true" className="-ml-[0.015em] whitespace-nowrap text-[64px] uppercase font-black leading-[0.9] tracking-[-0.05em] text-black md:text-[clamp(72px,9vw,128px)]">
                {heroMark(program).text.split("–").map((part, i) => (i === 0 ? part : <span key={i}><span className="mx-[0.06em] text-primary">–</span>{part}</span>))}
              </div>
              <div className="mt-3 flex items-center gap-2.5 md:mt-3.5">
                <span aria-hidden="true" className="h-1 w-8 bg-primary md:w-9" />
                <span className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-black md:text-[13px]">{heroMark(program).tag}</span>
              </div>
              <h3 className="mb-2 mt-3 text-[28px] font-black uppercase leading-[0.95] tracking-tight text-black md:mb-2.5 md:mt-4 md:text-[clamp(32px,4vw,52px)]">
                <Link href={program.href} className="hover:text-primary transition-colors">
                  {program.title}
                </Link>
              </h3>
              <p className="max-w-[440px] text-[13.5px] leading-snug text-gray-600 md:text-[17px] md:leading-relaxed">{program.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 md:mt-5">
                <Link href={program.href} className="inline-flex min-h-[44px] items-center gap-2 bg-primary px-5 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-orange-600 md:min-h-[46px]">
                  {buttonLabel}
                  <span className="sr-only"> about {program.title}</span> <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link href="/programs" onClick={toAllPrograms} className="group/skip hidden min-h-[46px] items-center gap-2 bg-black px-5 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-[#1f1b16] md:inline-flex">
                  See all programs <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover/skip:translate-x-0.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="relative row-start-1 overflow-hidden rounded-2xl bg-gray-100 md:col-start-2 md:aspect-[4/3] md:max-h-full md:self-center">
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
                className="absolute -inset-x-[4%] -inset-y-[2%] will-change-transform"
              >
                <Image src={program.image} alt={program.imageAlt} fill sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover object-[50%_30%]" priority={index === 0} />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
            </div>
          ))}
          <span ref={counterRef} aria-hidden="true" className="absolute right-4 top-3.5 z-10 text-[13px] font-extrabold tracking-[0.12em] text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.5)]">
            01 / {String(count).padStart(2, "0")}
          </span>
        </div>

        <div ref={railRef} className="relative col-span-full mt-0 h-[124px] md:mt-3.5 md:h-[132px]">
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
              className="group absolute top-[50px] h-0 w-0 cursor-pointer md:top-[64px]"
            >
              <span aria-hidden="true" className="absolute -left-10 -top-6 h-16 w-20" />
              <span className="absolute -left-[9px] -top-[9px] h-[18px] w-[18px] rounded-full border-4 border-[#d4cec5] bg-white transition-all group-hover:scale-125 group-hover:border-primary group-data-[on=true]:border-primary group-data-[on=true]:bg-primary" />
              <span
                className={`absolute top-[15px] text-[10px] font-extrabold uppercase leading-[1.15] tracking-[0.03em] text-[#6b6258] underline-offset-4 transition-colors group-hover:text-black group-hover:underline group-data-[on=true]:text-black md:top-[18px] md:whitespace-nowrap md:text-[11.5px] md:tracking-[0.08em] ${
                  index === 0 ? "-left-2 w-[68px] text-left md:w-auto" : index === count - 1 ? "-right-2 w-[68px] text-right md:w-auto" : "left-1/2 w-[68px] -translate-x-1/2 text-center md:w-auto"
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

        <div className="absolute inset-x-0 bottom-3 flex flex-col items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b6258] md:bottom-4 md:flex-row md:justify-center md:gap-4 md:tracking-[0.16em]">
          <span aria-hidden="true" className="pointer-events-none">
            <span className="md:hidden">Swipe, or tap a program</span>
            <span className="hidden md:inline">Scroll or swipe, or tap a program</span>
          </span>
          <Link href="/programs" onClick={toAllPrograms} className="group/skip inline-flex min-h-[44px] items-center gap-2 bg-black px-6 text-xs font-extrabold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#1f1b16] md:hidden">
            See all programs <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover/skip:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
