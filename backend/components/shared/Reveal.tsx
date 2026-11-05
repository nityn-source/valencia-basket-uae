"use client";

import { useInView } from "@/hooks/useInView";

interface RevealProps {
  children: React.ReactNode;
  /** Extra Tailwind classes on the wrapper div */
  className?: string;
}

/**
 * Wraps children in a fade-up reveal that fires once when the element
 * first scrolls into view. Uses IntersectionObserver — no library required.
 * Respects prefers-reduced-motion (shows content immediately if set).
 */
export function Reveal({ children, className = "" }: RevealProps) {
  const { ref, inView } = useInView();

  return (
    <div
      ref={ref}
      data-no-reveal=""
      className={[
        "transition-[opacity,transform] duration-[600ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[18px]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
