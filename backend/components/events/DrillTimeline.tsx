"use client";

import { useEffect, useRef, useState } from "react";

interface Drill {
  title: string;
  text: string;
}

/**
 * The drills of a week as a timeline. As the page scrolls, an orange line runs down the left and each drill
 * lights up when it reaches the middle of the screen. Without scripting or with reduced motion every drill is
 * simply shown lit.
 */
export function DrillTimeline({ drills }: { drills: Drill[] }) {
  const listRef = useRef<HTMLOListElement>(null);
  const [lit, setLit] = useState(drills.length);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const list = listRef.current;
    if (!list) return;
    let frame = 0;
    const update = () => {
      const trigger = window.innerHeight * 0.62;
      const items = Array.from(list.children) as HTMLElement[];
      setLit(items.filter((li) => li.getBoundingClientRect().top + 28 <= trigger).length);
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

  return (
    <ol ref={listRef} className="relative">
      {drills.map((d, i) => {
        const on = i < lit;
        const last = i === drills.length - 1;
        return (
          <li key={d.title} className={`relative border-b border-[#e8e2d6] py-5 pl-14 transition-[opacity,transform] duration-500 ${on ? "opacity-100" : "translate-x-1 opacity-40"}`}>
            {!last && (
              <>
                <span aria-hidden="true" className="absolute left-[15px] top-7 -bottom-7 w-[2px] bg-[#f0d9c8]" />
                <span
                  aria-hidden="true"
                  className={`absolute left-[15px] top-7 -bottom-7 w-[2px] origin-top bg-primary transition-transform duration-500 ${i + 1 < lit ? "scale-y-100" : "scale-y-0"}`}
                />
              </>
            )}
            <span
              aria-hidden="true"
              className={`absolute left-0 top-3 z-[1] flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary text-xs font-black transition-all duration-500 ${on ? "scale-100 bg-primary text-white" : "scale-90 bg-white text-primary"}`}
            >
              {i + 1}
            </span>
            <strong className="block text-[17px] leading-snug">{d.title}</strong>
            {d.text && <span className="mt-0.5 block text-[15px] text-[#5b5348]">{d.text}</span>}
          </li>
        );
      })}
    </ol>
  );
}
