// PLACEHOLDERS ON THIS PAGE:
// [PLACEHOLDER: session length — confirm] — e.g. "45 minutes"
// [PLACEHOLDER: coach-to-player ratio — confirm] — e.g. "1:8"
// [PLACEHOLDER: weekly frequency — confirm] — currently shown as Mon/Wed from /programs, verify if correct

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Heart, Zap, Users, Check } from "lucide-react";
import { buildPageMetadata, getAltResolver } from "@/lib/seo/resolve";
import { getStructuredData } from "@/lib/seo/structuredDataResolve";
import { StructuredData } from "@/components/seo/StructuredData";
import { getContentGetter } from "@/lib/content/pageContent";
import { RichTitle } from "@/components/shared/RichTitle";
import { ReelsCarousel } from "@/components/reels/ReelsCarousel";
import { getReels } from "@/lib/content/reelsStore";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("/programs/future-ballers");
}

const pillarIcons = [Zap, Star, Heart, Users];

const focusIcons = [Zap, Heart, Star, Users];

export default async function FutureBallers() {
  const alt = await getAltResolver();
  const schema = await getStructuredData("/programs/future-ballers", "Future Ballers");
  const c = await getContentGetter();
  const heroImage = c("program.future-ballers.image");
  const sessionImage = c("future-ballers.session.image");
  const pillars = pillarIcons.map((icon, i) => ({
    icon,
    title: c(`future-ballers.pillar${i + 1}.title`),
    points: [1, 2, 3, 4].map((n) => c(`future-ballers.pillar${i + 1}.point${n}`)),
  }));
  const focusAreas = focusIcons.map((icon, i) => ({
    icon,
    title: c(`future-ballers.focus${i + 1}.title`),
    desc: c(`future-ballers.focus${i + 1}.desc`),
  }));
  const steps = Array.from({ length: 4 }, (_, i) => ({
    step: String(i + 1).padStart(2, "0"),
    title: c(`future-ballers.step${i + 1}.title`),
    desc: c(`future-ballers.step${i + 1}.desc`),
  }));
  return (
    <>
      <StructuredData data={schema} />
      {/* ── HERO — Lever 2: large orange circles, most playful/airy ── */}
      <div className="bg-black text-white py-24 relative overflow-hidden">
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary/15 pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-primary/10 pointer-events-none" />
        <div className="absolute top-1/2 left-1/4 w-32 h-32 rounded-full bg-primary/5 pointer-events-none" />
        <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
          <span className="inline-block rounded-full bg-primary text-white px-4 py-1.5 font-bold uppercase text-xs tracking-widest mb-6">
            {c("future-ballers.hero.badge")}
          </span>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6">
            <RichTitle text={c("future-ballers.hero.title")} />
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            {c("future-ballers.hero.subtext")}
          </p>
          <div className="flex justify-center">
            <Link href="/#book-trial">
              <Button size="lg" className="uppercase font-bold tracking-wider rounded-none h-14 px-10 text-base">
                {c("future-ballers.hero.button")} <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── IMAGE LEFT / CONTENT RIGHT — Lever 1 ── */}
      <section className="bg-white py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* image LEFT — mobile: stacks first */}
            <div className="relative order-1">
              <div className="absolute -inset-4 border-2 border-primary/30 z-0 translate-x-4 translate-y-4" />
              <div className="relative z-10 aspect-[4/3] w-full overflow-hidden">
                <Image
                  src={heroImage}
                  alt={alt("future-ballers.hero")}
                  fill
                  className="object-cover shadow-2xl"
                  priority
                />
              </div>
            </div>
            {/* content RIGHT — mobile: stacks second */}
            <div className="order-2">
              <span className="text-primary font-bold uppercase tracking-widest text-sm mb-4 block">{c("future-ballers.about.eyebrow")}</span>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-6">
                <RichTitle text={c("future-ballers.about.title")} />
              </h2>
              <p className="text-gray-600 leading-relaxed text-lg mb-6">
                {c("future-ballers.about.paragraph1")}
              </p>
              <p className="text-gray-600 leading-relaxed text-lg mb-8">
                {c("future-ballers.about.paragraph2")}
              </p>
              {/* Lever 2: more padding, orange borders */}
              <div className="grid grid-cols-2 gap-4">                <div className="bg-gray-50 border-l-4 border-primary px-4 py-3">
                  <span className="block text-xs font-bold uppercase text-gray-400 mb-1">{c("future-ballers.stat.session.label")}</span>
                  <span className="font-bold text-gray-900">{c("future-ballers.stat.session.value")}</span>
                </div>
                
                {/* HIDDEN — un-hide and replace value once coach-to-player ratio is confirmed */}
                {false && (
                  <div className="bg-gray-50 border-l-4 border-primary px-4 py-3">
                    <span className="block text-xs font-bold uppercase text-gray-400 mb-1">Coach : Player Ratio</span>
                    <span className="font-bold text-gray-900">[PLACEHOLDER: coach-to-player ratio — confirm]</span>
                  </div>
                )}
                <div className="bg-gray-50 border-l-4 border-primary px-4 py-3">
                  <span className="block text-xs font-bold uppercase text-gray-400 mb-1">{c("future-ballers.stat.venue.label")}</span>
                  <span className="font-bold text-gray-900">{c("future-ballers.stat.venue.value")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW WE DEVELOP PLAYERS ── */}
      <section className="bg-neutral-900 text-white py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-14">
            <span className="inline-block rounded-full bg-primary text-white px-4 py-1.5 font-bold uppercase text-xs tracking-widest mb-4">
              {c("future-ballers.pillars.badge")}
            </span>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">
              {c("future-ballers.pillars.title")}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map(({ icon: Icon, title, points }) => (
              <div key={title} className="bg-white/5 border border-white/10 p-8 hover:border-primary/50 transition-all duration-300">
                <div className="w-12 h-12 bg-primary/15 flex items-center justify-center mb-6">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-black uppercase tracking-tight text-base mb-4">{title}</h3>
                <ul className="space-y-2">
                  {points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-gray-400 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOCUS AREAS — Lever 2: bigger cards (p-10, w-16 icons), more airy ── */}
      <section className="bg-gray-50 py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <span className="inline-block rounded-full bg-primary text-white px-4 py-1.5 font-bold uppercase text-xs tracking-widest mb-4">
              {c("future-ballers.focus.badge")}
            </span>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">{c("future-ballers.focus.title")}</h2>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto">{c("future-ballers.focus.subtext")}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {focusAreas.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white border border-primary/20 p-10 flex flex-col items-center text-center gap-5 hover:border-primary transition-colors shadow-sm">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-black uppercase text-lg tracking-tight">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SESSION — steps LEFT / image RIGHT (Lever 1: internal flip for variety) ── */}
      <section className="bg-black text-white py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* steps LEFT — mobile: stacks first */}
            <div className="order-1">
              <span className="text-primary font-bold uppercase tracking-widest text-sm mb-4 block">{c("future-ballers.session.eyebrow")}</span>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-8">
                {c("future-ballers.session.title")}
              </h2>
              <div className="space-y-6">
                {steps.map(({ step, title, desc }) => (
                  <div key={step} className="flex gap-5">
                    <span className="text-primary font-black text-2xl leading-none shrink-0 w-8">{step}</span>
                    <div>
                      <h4 className="font-bold uppercase tracking-wide mb-1">{title}</h4>
                      <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* image RIGHT — mobile: stacks second */}
            <div className="order-2 aspect-[3/4] w-full relative">
              <Image src={sessionImage} alt={alt("future-ballers.session")} fill className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Reels tagged "future-ballers" in data/reels.ts; renders nothing when there are none */}
      <ReelsCarousel reels={await getReels("future-ballers")} title="See it in action" text="Real sessions from the academy." />

      {/* ── CTA — Lever 2: most spacious (py-24) ── */}
      <section className="bg-primary py-24 text-white text-center">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4">
            {c("future-ballers.cta.title")}
          </h2>
          <p className="text-xl mb-10 max-w-xl mx-auto opacity-90">
            {c("future-ballers.cta.subtext")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/#book-trial">
              <Button size="lg" className="bg-black text-white hover:bg-white hover:text-primary uppercase font-bold tracking-wider rounded-none h-14 px-10 text-base border-0">
                {c("future-ballers.cta.button")} <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary uppercase font-bold tracking-wider rounded-none h-14 px-10 text-base">
                {c("future-ballers.cta.button2")}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
