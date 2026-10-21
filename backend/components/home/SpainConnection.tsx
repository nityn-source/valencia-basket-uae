"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { RichTitle } from "@/components/shared/RichTitle";

// Quadratic bezier: Valencia (upper-left) → Dubai (lower-right)
// Control point pulled well above centre line for a clear upward arc
const PATH = "M 80 90 Q 240 5 395 185";
const ARC_LENGTH = 450; // approximate bezier path length

export function SpainConnection({
  eyebrow = "The Spain Connection",
  title = "Born in Valencia.\nBuilt in Dubai.",
  text = "A direct connection to Spain's basketball methodology. Our players train the same system, right here in Dubai.",
  linkText = "Read about our methodology",
  label1 = "VALENCIA",
  label2 = "DUBAI",
}: {
  eyebrow?: string;
  title?: string;
  text?: string;
  linkText?: string;
  label1?: string;
  label2?: string;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-32 bg-neutral-900 text-white overflow-hidden"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* ── Left: text ── */}
          <div className={visible ? "animate-fade-in-up" : "opacity-0"}>
            <span
              className="block text-[11px] font-bold uppercase tracking-[0.22em] mb-5"
              style={{ color: "#FF6C0E" }}
            >
              {eyebrow}
            </span>
            <h2
              className="text-4xl md:text-5xl xl:text-[3.5rem] font-black uppercase tracking-tighter leading-none text-white mb-6"
            >
              <RichTitle text={title} />
            </h2>
            <p
              className="text-[17px] leading-relaxed mb-8"
              style={{ color: "rgba(255,255,255,0.62)" }}
            >
              {text}
            </p>
            <Link
              href="/methodology"
              className="inline-flex items-center gap-1.5 font-semibold underline underline-offset-4 transition-colors text-[15px] hover:opacity-75"
              style={{ color: "#FF6C0E" }}
            >
              {linkText} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* ── Right: SVG connection graphic ── */}
          <div className="flex items-center justify-center py-4 lg:py-0">
            {/*
              viewBox gives 30px headroom above arc peak (~y=5 control → actual peak ~y=50)
              overflow="visible" lets labels near the edges breathe without clipping
            */}
            <svg
              viewBox="-10 -30 500 290"
              className="w-full max-w-[440px]"
              aria-hidden="true"
              style={{ overflow: "visible" }}
            >
              {/* ── Dashed arc — draw-in animation ──
                  stroke-dasharray = one dash equal to full path length → starts hidden at offset=ARC_LENGTH,
                  animates to offset=0 to reveal the full stroke from Valencia to Dubai.
              */}
              <path
                d={PATH}
                fill="none"
                stroke="rgba(255,255,255,0.28)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray={`${ARC_LENGTH} ${ARC_LENGTH}`}
                strokeDashoffset={visible ? 0 : ARC_LENGTH}
                style={{
                  transition: visible
                    ? "stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)"
                    : "none",
                }}
              />

              {/* Dashed overlay fades in after draw completes — adds the "flight path" look */}
              <path
                d={PATH}
                fill="none"
                stroke="rgba(255,255,255,0.20)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray="6 13"
                style={{
                  opacity: visible ? 1 : 0,
                  transition: visible ? "opacity 0.2s ease 1.4s" : "none",
                }}
              />

              {/* ── Valencia dot (upper-left) ── */}
              <circle
                cx="80"
                cy="90"
                r="7"
                fill="#E8722C"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? "scale(1)" : "scale(0)",
                  transformOrigin: "80px 90px",
                  transition: visible
                    ? "opacity 0.35s ease 0.15s, transform 0.35s cubic-bezier(0.34,1.56,0.64,1) 0.15s"
                    : "none",
                }}
              />
              <text
                x="80"
                y="115"
                textAnchor="middle"
                fill="white"
                fontSize="11.5"
                fontWeight="700"
                letterSpacing="2.5"
                style={{
                  opacity: visible ? 1 : 0,
                  transition: visible ? "opacity 0.4s ease 0.5s" : "none",
                  fontFamily: "inherit",
                }}
              >
                {label1}
              </text>

              {/* ── Dubai dot (lower-right) ── */}
              <circle
                cx="395"
                cy="185"
                r="7"
                fill="#E8722C"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? "scale(1)" : "scale(0)",
                  transformOrigin: "395px 185px",
                  transition: visible
                    ? "opacity 0.35s ease 1.05s, transform 0.35s cubic-bezier(0.34,1.56,0.64,1) 1.05s"
                    : "none",
                }}
              />
              <text
                x="395"
                y="210"
                textAnchor="middle"
                fill="white"
                fontSize="11.5"
                fontWeight="700"
                letterSpacing="2.5"
                style={{
                  opacity: visible ? 1 : 0,
                  transition: visible ? "opacity 0.4s ease 1.25s" : "none",
                  fontFamily: "inherit",
                }}
              >
                {label2}
              </text>
            </svg>
          </div>

        </div>
      </div>
    </section>
  );
}
