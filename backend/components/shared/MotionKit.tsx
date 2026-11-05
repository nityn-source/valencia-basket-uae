"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Site-wide scroll motion. Pages are left as plain server markup: after the page loads this finds the
 * natural units (photos, card grids, text groups, tick lists), tags them for the CSS in globals.css
 * ("Motion kit"), and reveals each one as it scrolls into view.
 *  - Units already on screen when the page opens are left as they are (the page title has its own
 *    on-load animation), so nothing flashes. Units still below the fold start hidden and animate once.
 *  - While the orange page wipe is covering the screen (html.wipe-pending) reveals wait until it clears.
 *  - Forms, carousels, the pinned pathway, dialogs, long-reading pages and /admin are never touched,
 *    and reduced-motion visitors skip all of it.
 * Elements a page marks itself (rv-photo, rv-stagger, ...) are revealed the same way.
 */
const UNITS = ".rv-photo,.rv-stagger,.rv-item,.rv-fade,.rv-check,.rv-num,.rv-step";
const SKIP_PAGES = /^\/(admin|privacy-policy|terms|thank-you)(\/|$)|\/register\/?$|^\/$/;
const BLOG_POST = /^\/blog\/(?!author\/)[^/]+\/?$/;
const SKIP_INSIDE =
  '[data-no-reveal],form,[aria-roledescription="carousel"],[data-testid="player-pathway"],nav,header,footer,dialog,[role="dialog"]';

const el = (node: Element | null): node is HTMLElement => node instanceof HTMLElement;

export function MotionKit() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;
    const pending = () => root.classList.contains("wipe-pending");
    const waiting = new Set<Element>();
    const watched = new WeakSet<Element>();

    const reveal = (node: Element) => {
      node.classList.add("rv-in");
      io.unobserve(node);
      waiting.delete(node);
    };
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (pending()) waiting.add(entry.target);
          else reveal(entry.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0 },
    );
    // When the page wipe clears, whatever is in view starts its reveal.
    const classWatch = new MutationObserver(() => {
      if (!pending()) waiting.forEach(reveal);
    });
    classWatch.observe(root, { attributes: true, attributeFilter: ["class"] });

    const tag = (node: HTMLElement, cls: string) => {
      node.classList.add(cls);
      node.dataset.rvAuto = "";
    };
    const annotate = (main: HTMLElement) => {
      const skipped = (node: Element) => !!node.closest(SKIP_INSIDE);

      // Lists and grids: every child becomes its own unit, staggered along its row.
      main.querySelectorAll<HTMLElement>('.grid,[class*="space-y-"]').forEach((list) => {
        if (watched.has(list) || skipped(list) || list.parentElement?.closest("[data-rv-list]")) return;
        // Layouts a page already marked up itself (rv-photo, rv-stagger, ...) keep their own choreography.
        if (list.matches(".rv-check") || Array.from(list.querySelectorAll(".rv-photo,.rv-stagger,.rv-num")).some((unit) => !("rvAuto" in (unit as HTMLElement).dataset))) return;
        const kids = Array.from(list.children).filter((child): child is HTMLElement => child instanceof HTMLElement && child.offsetParent !== null);
        if (kids.length < 3) return;
        watched.add(list);
        list.dataset.rvList = "";
        const rowTop = kids[0].offsetTop;
        const cols = Math.min(6, Math.max(1, kids.filter((kid) => kid.offsetTop === rowTop).length));
        kids.forEach((kid, i) => {
          tag(kid, "rv-item");
          kid.style.setProperty("--rv-delay", `${(i % cols) * 70}ms`);
        });
      });

      // Section headings: the heading block fades up in order, or just the heading if its parent holds more.
      main.querySelectorAll<HTMLElement>("h2").forEach((heading) => {
        if (watched.has(heading) || skipped(heading) || heading.closest("[data-rv-list],.rv-stagger,.rv-item,.rv-fade")) return;
        watched.add(heading);
        const group = heading.parentElement;
        const kids = group ? Array.from(group.children) : [];
        const tidy = kids.length >= 2 && kids.length <= 7 && kids.every((kid) => kid.querySelectorAll("*").length <= 14 && !kid.matches(".grid,.rv-photo"));
        if (group && group !== main && tidy) {
          tag(group, "rv-stagger");
          return;
        }
        tag(heading, "rv-fade");
        const before = heading.previousElementSibling;
        const after = heading.nextElementSibling;
        if (el(before) && before.matches("span,p") && before.textContent!.length < 60) tag(before, "rv-fade");
        if (el(after) && after.matches("p")) tag(after, "rv-fade");
      });

      // Photos: the box around each large image wipes open (cards in a grid are covered by their own stagger).
      main.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
        const box = img.parentElement;
        if (!el(box) || watched.has(box) || skipped(img) || box.closest(".rv-item,.rv-photo,[data-rv-list]")) return;
        const rect = box.getBoundingClientRect();
        if (rect.width < 160 || rect.height < 120 || box.querySelectorAll("*").length > 8) return;
        watched.add(box);
        tag(box, "rv-photo");
      });

      // Tick lists: the ticks pop in one by one.
      main.querySelectorAll<HTMLElement>("ul").forEach((list) => {
        if (watched.has(list) || skipped(list) || !list.querySelector("li > svg.lucide-check")) return;
        watched.add(list);
        tag(list, "rv-check");
      });
    };

    const observeUnits = (main: HTMLElement) => {
      main.querySelectorAll<HTMLElement>(UNITS).forEach((unit) => {
        if (unit.classList.contains("rv-in") || waiting.has(unit)) return;
        // Auto-tagged units that are already on screen simply stay as they are; marked ones play.
        if ("rvAuto" in unit.dataset && !pending() && unit.getBoundingClientRect().top < window.innerHeight * 0.88) {
          unit.classList.add("rv-in");
          return;
        }
        io.observe(unit);
      });
    };

    const main = document.querySelector("main");
    if (!el(main)) return;
    const skipAuto = SKIP_PAGES.test(pathname) || BLOG_POST.test(pathname);
    const run = () => {
      if (!skipAuto) annotate(main);
      observeUnits(main);
    };
    run();
    // Parts a page draws on the client appear a moment later.
    let timer = window.setTimeout(run, 600);
    const content = new MutationObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(run, 250);
    });
    content.observe(main, { childList: true, subtree: true });

    return () => {
      window.clearTimeout(timer);
      io.disconnect();
      classWatch.disconnect();
      content.disconnect();
    };
  }, [pathname]);

  return null;
}
