"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

/** Pages that have their own form or their own bar, or are not for visitors. */
const HIDDEN_ON = /^\/(admin|thank-you|contact)(\/|$)/;

/**
 * Phones only: a slim "Book now" bar at the bottom once the visitor has scrolled past the first screen. It steps aside
 * while the booking form or the footer is on screen, and on pages that have their own form or bar (the camp pages).
 */
export function StickyBookBar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [covered, setCovered] = useState(false);
  const [ownBar, setOwnBar] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setCovered(false);
    // Camp pages bring their own bar (with the countdown and a Register button).
    const check = () => setOwnBar(Boolean(document.querySelector("[data-camp-bar]")));
    check();
    const timer = window.setTimeout(check, 600);
    const seen = new Set<Element>();
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) seen.add(entry.target);
        else seen.delete(entry.target);
      }
      setCovered(seen.size > 0);
    });
    const watch = () => document.querySelectorAll("#book-trial, #register, #quick-trial, footer").forEach((el) => io.observe(el));
    watch();
    const late = window.setTimeout(watch, 800);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(late);
      io.disconnect();
    };
  }, [pathname]);

  if (HIDDEN_ON.test(pathname) || ownBar) return null;
  const show = scrolled && !covered;
  const href = pathname === "/" ? "#book-trial" : "/#book-trial";

  return (
    <div
      aria-hidden={!show}
      className={`fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 bg-primary pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pl-4 pr-24 pt-3 text-white shadow-[0_-4px_20px_rgba(0,0,0,0.18)] transition-transform duration-300 md:hidden ${show ? "translate-y-0" : "pointer-events-none translate-y-full"}`}
      data-testid="sticky-book-bar"
    >
      <span className="text-[11px] font-extrabold uppercase leading-tight tracking-[0.14em]">Free trial session</span>
      <Link href={href} tabIndex={show ? 0 : -1} className="whitespace-nowrap bg-black px-4 py-3 text-xs font-extrabold uppercase tracking-widest text-white">
        Book now
      </Link>
    </div>
  );
}
