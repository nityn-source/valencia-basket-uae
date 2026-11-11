import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, MessageCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildPageMetadata, getAltResolver } from "@/lib/seo/resolve";
import { getStructuredData } from "@/lib/seo/structuredDataResolve";
import { buildFaqStructuredData } from "@/lib/seo/structuredData";
import { StructuredData } from "@/components/seo/StructuredData";
import { getContentGetter } from "@/lib/content/pageContent";
import { RichTitle } from "@/components/shared/RichTitle";
import { BookTrialForm } from "@/components/home/BookTrialForm";
import { ReelsCarousel } from "@/components/reels/ReelsCarousel";
import { VideoTestimonials } from "@/components/home/VideoTestimonials";
import { GirlsLevelPicker } from "@/components/programs/GirlsLevelPicker";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { getReels } from "@/lib/content/reelsStore";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("/programs/girls-basketball");
}

const WHATSAPP_HREF = `https://wa.me/971544386838?text=${encodeURIComponent("Hi! I'd like to book a free trial session for my daughter at Valencia Basket Academy.")}`;
const SHORTS = ["lHOEgwOfR38", "C3JhNm-HBfM", "J7qc0vEmXTA", "hfCYCJ7kqjU"].map((id) => ({ url: `https://www.youtube.com/shorts/${id}`, name: "", role: "", quote: "" }));
// Levels 1–3 have their own pages; Elite is by invitation and sends to the trial form.
const LEVEL_LINKS = ["/programs/future-ballers", "/programs/mini-basket", "/programs/youth-academy", "#girls-trial"];

export default async function GirlsBasketball() {
  const alt = await getAltResolver();
  const c = await getContentGetter();
  const faqs = Array.from({ length: 8 }, (_, i) => ({ question: c(`girls.faq${i + 1}.q`), answer: c(`girls.faq${i + 1}.a`) }));
  const schema = [...(await getStructuredData("/programs/girls-basketball", "Girls' Basketball Programs")), buildFaqStructuredData(faqs)];
  const strip = [1, 2, 3, 4, 5].map((n) => c(`girls.hero.strip${n}`));
  const why = [1, 2, 3, 4].map((n) => ({ title: c(`girls.why${n}.title`), desc: c(`girls.why${n}.desc`) }));
  const levels = [1, 2, 3, 4].map((n) => ({
    n,
    age: c(`girls.level${n}.age`),
    title: c(`girls.level${n}.title`),
    tagline: c(`girls.level${n}.tagline`),
    desc: c(`girls.level${n}.desc`),
    focus: [1, 2, 3, 4].map((f) => c(`girls.level${n}.focus${f}`)),
    href: LEVEL_LINKS[n - 1],
    label: n === 4 ? c("girls.level4.button") : c("girls.level.learn-more"),
  }));
  const includes = [1, 2, 3, 4, 5].map((n) => c(`girls.includes${n}`));

  return (
    <>
      <StructuredData data={schema} />

      {/* ── HERO ── */}
      <div className="bg-black py-20 text-white md:py-24">
        <div className="container mx-auto px-4 text-center md:px-6">
          <span className="mb-6 inline-block rounded-full bg-primary px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white">{c("girls.hero.badge")}</span>
          <h1 className="page-title mb-6 text-5xl font-black uppercase tracking-tighter md:text-7xl">
            <RichTitle text={c("girls.hero.title")} />
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-xl text-gray-400">{c("girls.hero.subtext")}</p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <a href="#girls-trial">
              <Button size="lg" className="h-14 w-full rounded-none px-10 text-base font-bold uppercase tracking-wider sm:w-auto">
                {c("girls.hero.button")} <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
            <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="h-14 w-full rounded-none border-white bg-transparent px-10 text-base font-bold uppercase tracking-wider text-white hover:bg-white hover:text-black sm:w-auto">
                <MessageCircle className="mr-2 h-5 w-5" /> {c("girls.hero.button2")}
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* ── TRUST BANNER: sliding strip like the homepage trust bar (pauses on hover; still and scrollable with reduced motion) ── */}
      <div className="bg-primary py-5 md:py-6" data-testid="girls-strip">
        <div className="marquee-container overflow-hidden">
          <div className="marquee-track flex w-max items-center hover:[animation-play-state:paused]" aria-label="Girls programs highlights">
            {[0, 1, 2, 3, 4, 5].map((copy) => (
              <div key={copy} className={copy === 0 ? "contents" : "marquee-duplicate contents"} aria-hidden={copy === 0 ? undefined : true}>
                {strip.map((item) => (
                  <div key={`${copy}-${item}`} className="group flex items-center gap-3 px-8 md:px-12">
                    <span aria-hidden="true" className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-black/20 transition-colors group-hover:bg-black">
                      <span className="h-[7px] w-[7px] rounded-full bg-white" />
                    </span>
                    <span className="whitespace-nowrap text-sm font-bold uppercase tracking-wider text-white">{item}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── INTRO ── */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div className="relative order-1">
              <div className="absolute -inset-4 z-0 translate-x-4 translate-y-4 border-2 border-primary/30" />
              <div className="relative z-10 aspect-[4/3] w-full overflow-hidden">
                <Image src={c("girls.intro.image")} alt={alt("girls.intro")} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover shadow-2xl" priority />
              </div>
            </div>
            <div className="order-2">
              <h2 className="mb-6 text-4xl font-black uppercase tracking-tighter md:text-5xl"><RichTitle text={c("girls.intro.title")} /></h2>
              <p className="mb-8 text-lg leading-relaxed text-gray-600">{c("girls.intro.paragraph")}</p>
              <div className="grid grid-cols-2 gap-3">
                {(["coaches", "venue"] as const).map((k) => (
                  <div key={k} className="border-l-4 border-primary bg-gray-50 px-3 py-2">
                    <span className="mb-0.5 block text-xs font-bold uppercase text-gray-400">{c(`girls.stat.${k}.label`)}</span>
                    <span className="text-sm font-bold text-gray-900">{c(`girls.stat.${k}.value`)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LEVELS ── */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 md:px-6">
          <p className="mb-3 text-center text-4xl font-black uppercase tracking-tighter md:text-5xl"><RichTitle text={c("girls.levels.title")} /></p>
          <p className="mx-auto mb-8 max-w-xl text-center text-gray-600">Pick her age group to see what she will work on.</p>
          <GirlsLevelPicker levels={levels} />
        </div>
      </section>

      {/* ── NOT SURE WHICH LEVEL ── */}
      <section className="bg-black py-14 text-white md:py-16">
        <div className="container mx-auto max-w-3xl px-4 text-center md:px-6">
          <h2 className="mb-4 text-4xl font-black uppercase tracking-tighter md:text-5xl">{c("girls.notsure.title")}</h2>
          <p className="mb-8 text-lg leading-relaxed text-gray-400">{c("girls.notsure.text")}</p>
          <a href="#girls-trial">
            <Button size="lg" className="h-14 w-full rounded-none px-10 text-base font-bold uppercase tracking-wider sm:w-auto">
              {c("girls.hero.button")} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </a>
        </div>
      </section>

      {/* ── VIDEOS — the same YouTube carousel as the homepage, then the Instagram reels block the other program pages use ── */}
      <section className="bg-white py-14 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <SectionHeader title={c("girls.videos.title")} description={c("girls.videos.text")} centered className="mb-8 md:mb-10" />
          <VideoTestimonials videos={SHORTS} ctaLabel={c("girls.hero.button")} />
        </div>
      </section>
      <ReelsCarousel reels={await getReels("girls-basketball")} title="See it in action" text="Real sessions from the academy." />

      {/* ── WHY GIRLS CHOOSE US ── */}
      <section className="bg-neutral-900 py-16 text-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-12 text-center">
            <span className="mb-4 inline-block rounded-full bg-primary px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white">{c("girls.why.badge")}</span>
            <h2 className="mx-auto max-w-3xl text-4xl font-black uppercase tracking-tighter md:text-5xl">{c("girls.why.title")}</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {why.map((w) => (
              <div key={w.title} className="border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:border-primary/50">
                <h3 className="mb-3 text-sm font-black uppercase tracking-tight">{w.title}</h3>
                <p className="text-sm leading-relaxed text-gray-400">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TWO COACHES ── */}
      <section className="bg-white py-16 text-black">
        <div className="container mx-auto max-w-3xl px-4 text-center md:px-6">
          <span className="mb-4 block text-sm font-bold uppercase tracking-widest text-primary">{c("girls.coaches.eyebrow")}</span>
          <h2 className="mb-6 text-4xl font-black uppercase tracking-tighter md:text-5xl"><RichTitle text={c("girls.coaches.title")} /></h2>
          <p className="text-lg leading-relaxed text-gray-600">{c("girls.coaches.text")}</p>
        </div>
      </section>

      {/* ── WHAT EVERY PROGRAM INCLUDES ── */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto max-w-4xl px-4 md:px-6">
          <h2 className="mb-8 text-4xl font-black uppercase tracking-tighter md:text-5xl">{c("girls.includes.title")}</h2>
          <ul className="grid gap-4">
            {includes.map((item) => (
              <li key={item} className="flex items-start gap-3 border-l-4 border-primary bg-gray-50 px-4 py-3 text-base font-medium text-gray-800">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" /> {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── REGISTRATION FORM: the homepage booking form; every lead from this page is saved as a girl, so it never asks ── */}
      <section id="girls-trial" className="relative scroll-mt-24 bg-primary py-12 md:py-16">
        <div className="container mx-auto max-w-3xl px-4 md:px-6">
          <BookTrialForm sourcePage="programs-girls" headingAs="h2" heading={c("girls.form.title")} subheading={c("girls.form.text")} submitLabel={c("girls.form.button")} />
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-white py-16">
        <div className="container mx-auto max-w-4xl px-4 md:px-6">
          <h2 className="mb-8 text-4xl font-black uppercase tracking-tighter md:text-5xl">{c("girls.faq.title")}</h2>
          <div className="divide-y divide-gray-200 border-y border-gray-200">
            {faqs.map((f) => (
              <details key={f.question} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold">
                  {f.question}
                  <Plus className="h-5 w-5 shrink-0 text-primary transition-transform group-open:rotate-45" aria-hidden="true" />
                </summary>
                <p className="mt-3 leading-relaxed text-gray-600">{f.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}
