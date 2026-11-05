"use client";

import { useEffect } from "react";
import { usePathname, type useRouter } from "next/navigation";

type Router = ReturnType<typeof useRouter>;

interface PendingWipe {
  el: HTMLElement;
  href: string;
  timer: number;
}

declare global {
  interface Window {
    __pageWipe?: PendingWipe;
  }
}

const IN_MS = 480;
const HOLD_MS = 300;
const OUT_MS = 560;
const EASING = "cubic-bezier(.7,0,.3,1)";

function finish() {
  const wipe = window.__pageWipe;
  if (!wipe) return;
  clearTimeout(wipe.timer);
  window.__pageWipe = undefined;
  const slideOut = wipe.el.animate([{ transform: "translateX(0)" }, { transform: "translateX(100%)" }], { duration: OUT_MS, easing: EASING, fill: "forwards" });
  slideOut.finished.then(() => wipe.el.remove(), () => wipe.el.remove());
}

/**
 * Click handler for a link that opens `href` behind a full-screen orange wipe.
 * The panel is plain DOM so it survives the route change; <PageWipeFinish /> slides it away
 * once the new page is in. Modified clicks and reduced-motion visitors get the normal link.
 */
export function wipeNavigate(e: React.MouseEvent, router: Router, href: string, label: string) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  e.preventDefault();
  if (window.__pageWipe) return;
  router.prefetch(href);
  const el = document.createElement("div");
  el.setAttribute("aria-hidden", "true");
  el.style.cssText =
    "position:fixed;inset:0;z-index:100;background:#FF6C0E;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:clamp(40px,9vw,120px);letter-spacing:-0.04em;text-transform:uppercase;transform:translateX(-100%)";
  el.textContent = label;
  document.body.appendChild(el);
  // Safety net: never leave the screen covered if the page is slow or fails to load.
  const timer = window.setTimeout(finish, 6000);
  window.__pageWipe = { el, href, timer };
  const slideIn = el.animate([{ transform: "translateX(-100%)" }, { transform: "translateX(0)" }], { duration: IN_MS, easing: EASING, fill: "forwards" });
  slideIn.finished.then(() => router.push(href), finish);
}

/** Mounted once in the app shell: slides the wipe away when the page it was covering for has arrived. */
export function PageWipeFinish() {
  const pathname = usePathname();
  useEffect(() => {
    const wipe = window.__pageWipe;
    if (!wipe || pathname !== wipe.href) return;
    const timer = window.setTimeout(finish, HOLD_MS);
    return () => clearTimeout(timer);
  }, [pathname]);
  return null;
}
