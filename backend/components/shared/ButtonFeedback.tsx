"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Button micro-interactions, applied to every call-to-action on the public site through one set of
 * delegated listeners (nothing is attached per button):
 *  - press-in, a ripple from the touch point and an arrow pop while a button is held (the look lives in globals.css)
 *  - on mouse screens, the arrow grows as the pointer approaches
 *  - a light haptic tick on a confirmed touch tap (Android vibrate; a hidden iOS switch where Safari allows it)
 *  - main "Book a free trial" buttons that start below the fold settle in as they scroll into view
 * Buttons are found by their classes, so new ones are picked up without extra markup.
 */
const CANDIDATES = ["a", "button"].flatMap((tag) => ["bg-primary", "bg-black", "bg-[#E8722C]"].map((cls) => `${tag}[class*="${cls}"]`)).join(",");
const APPROACH_RANGE = 120;

let lastBuzz = 0;
let switchLabel: HTMLLabelElement | null = null;

/** A short tap feel. Silent where the phone or browser doesn't support it. */
function buzz() {
  const now = performance.now();
  if (now - lastBuzz < 80) return;
  lastBuzz = now;
  if (typeof navigator.vibrate === "function") {
    navigator.vibrate(10);
    return;
  }
  // iOS Safari has no vibrate; toggling a (hidden) switch control gives a system haptic on recent versions.
  if (!window.matchMedia("(pointer: coarse)").matches) return;
  if (!switchLabel) {
    const label = document.createElement("label");
    label.setAttribute("aria-hidden", "true");
    label.style.cssText = "position:fixed;left:-100px;top:-100px;width:1px;height:1px;opacity:0;pointer-events:none";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.setAttribute("switch", "");
    input.tabIndex = -1;
    label.appendChild(input);
    document.body.appendChild(label);
    switchLabel = label;
  }
  switchLabel.click();
}

export function ButtonFeedback() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const visible = new Set<HTMLElement>();
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting) visible.add(el);
        else visible.delete(el);
      }
    });
    const settleIo = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("cta-in");
          settleIo.unobserve(entry.target);
        }
      },
      { threshold: 0.6 },
    );

    // Elements may already carry the markers (React runs effects twice in development, and the same
    // buttons are re-scanned on every page), so each run keeps its own record of what it observes.
    const watched = new WeakSet<Element>();
    const tag = (root: ParentNode) => {
      const found = Array.from(root.querySelectorAll<HTMLElement>(`${CANDIDATES},[data-cta]`)).filter((el) => !watched.has(el) && !el.closest("[data-no-cta]"));
      // Read sizes first, then write, so tagging causes one layout pass at most.
      const sizes = found.map((el) => el.offsetHeight);
      found.forEach((el, i) => {
        if (!el.hasAttribute("data-cta") && sizes[i] > 100) return; // big cards that merely have a coloured background aren't buttons
        el.setAttribute("data-cta", "");
        watched.add(el);
        io.observe(el);
      });
      if (reduced) return;
      root.querySelectorAll<HTMLElement>('a[href*="#book-trial"], a[href*="#book-trial"] > button').forEach((el) => {
        if (el.classList.contains("cta-in") || el.closest("nav, header, [data-testid='story-viewer']")) return;
        if (!el.hasAttribute("data-cta-settle")) {
          if (el.getBoundingClientRect().top < window.innerHeight) return; // already on screen: leave it be
          el.setAttribute("data-cta-settle", "");
        }
        settleIo.observe(el);
      });
    };

    let pending = 0;
    const schedule = () => {
      if (pending) return;
      pending = window.setTimeout(() => {
        pending = 0;
        tag(document);
      }, 200);
    };
    tag(document);
    const mutations = new MutationObserver(schedule);
    mutations.observe(document.body, { childList: true, subtree: true });

    let down: HTMLElement | null = null;
    let moved = false;
    let startX = 0;
    let startY = 0;
    const ctaOf = (target: EventTarget | null) => (target as Element | null)?.closest?.("[data-cta]") as HTMLElement | null;
    const onDown = (event: PointerEvent) => {
      const el = ctaOf(event.target);
      if (!el || el.matches(":disabled, [aria-disabled='true']")) return;
      down = el;
      moved = false;
      startX = event.clientX;
      startY = event.clientY;
      if (reduced) return;
      const box = el.getBoundingClientRect();
      el.style.setProperty("--rx", `${event.clientX - box.left}px`);
      el.style.setProperty("--ry", `${event.clientY - box.top}px`);
      el.classList.add("cta-down");
    };
    const onMove = (event: PointerEvent) => {
      if (down && Math.hypot(event.clientX - startX, event.clientY - startY) > 10) moved = true;
    };
    const release = (event: PointerEvent, tapped: boolean) => {
      if (!down) return;
      down.classList.remove("cta-down");
      if (tapped && !moved && event.pointerType !== "mouse") buzz();
      down = null;
    };
    const onUp = (event: PointerEvent) => release(event, true);
    const onCancel = (event: PointerEvent) => release(event, false);
    window.addEventListener("pointerdown", onDown, { passive: true, capture: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true, capture: true });
    window.addEventListener("pointercancel", onCancel, { passive: true, capture: true });

    // Mouse screens: the arrow in a button grows as the pointer gets close.
    let frame = 0;
    let mx = 0;
    let my = 0;
    const update = () => {
      frame = 0;
      visible.forEach((el) => {
        const box = el.getBoundingClientRect();
        const dx = Math.max(box.left - mx, 0, mx - box.right);
        const dy = Math.max(box.top - my, 0, my - box.bottom);
        const k = Math.max(0, 1 - Math.hypot(dx, dy) / APPROACH_RANGE);
        if (Math.abs(k - Number(el.dataset.k ?? 0)) > 0.03) {
          el.dataset.k = k.toFixed(2);
          el.style.setProperty("--k", k.toFixed(2));
        }
      });
    };
    const onHover = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      mx = event.clientX;
      my = event.clientY;
      if (!frame) frame = requestAnimationFrame(update);
    };
    const hoverQuery = window.matchMedia("(hover: hover)");
    if (hoverQuery.matches && !reduced) window.addEventListener("pointermove", onHover, { passive: true });

    return () => {
      clearTimeout(pending);
      cancelAnimationFrame(frame);
      mutations.disconnect();
      io.disconnect();
      settleIo.disconnect();
      window.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp, true);
      window.removeEventListener("pointercancel", onCancel, true);
      window.removeEventListener("pointermove", onHover);
    };
  }, [pathname]);

  return null;
}
