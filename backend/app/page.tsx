import { Hero } from "@/components/home/Hero";
import { TrustBar } from "@/components/shared/TrustBar";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { ProgramCard } from "@/components/shared/ProgramCard";
import { BookTrialForm } from "@/components/home/BookTrialForm";
import { EventStrip } from "@/components/home/EventStrip";
import { SpainConnection } from "@/components/home/SpainConnection";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Zap, Crosshair, Target, Clock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Reveal } from "@/components/shared/Reveal";
import { buildPageMetadata, getAltResolver } from "@/lib/seo/resolve";
import { getStructuredData } from "@/lib/seo/structuredDataResolve";
import { StructuredData } from "@/components/seo/StructuredData";
import { getContentGetter } from "@/lib/content/pageContent";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("/");
}

export default async function Home() {
  const alt = await getAltResolver();
  const schema = await getStructuredData("/");
  const c = await getContentGetter();
  const pillarIcons = [Zap, Crosshair, Target, Clock];
  const pillars = pillarIcons.map((icon, i) => ({
    icon,
    title: c(`home.pillar${i + 1}.title`),
    desc: c(`home.pillar${i + 1}.desc`),
  }));

  const testimonials = [1, 2, 3].map((n) => ({
    text: c(`home.testimonial${n}.text`),
    author: c(`home.testimonial${n}.author`),
    role: c(`home.testimonial${n}.role`),
  }));

  const futureBallersImage = c("program.future-ballers.image");
  const miniBasketImage = c("program.mini-basket.image");
  const youthAcademyImage = c("program.youth-academy.image");
  const eliteImage = c("program.elite.image");
  const privateTrainingImage = c("program.private-training.image");
  const methodologyImage = c("home.methodology.image");
  const arenaImage = c("home.facilities.image");
  const cardButton = c("home.programs.card-button");

  return (
    <>
      <StructuredData data={schema} />
      <Hero
        imageAlt={alt("home.hero")}
        subtext={c("home.hero.subtext")}
        imageSrc={c("home.hero.image")}
        badge={c("home.hero.badge")}
        line1={c("home.hero.line1")}
        line2={c("home.hero.line2")}
        primaryButton={c("home.hero.button1")}
        secondaryButton={c("home.hero.button2")}
      />

      <Reveal><TrustBar /></Reveal>

      {/* PROGRAMS SECTION */}
      <Reveal>
        <section id="programs" className="py-20 md:py-32 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <SectionHeader
              title={c("home.programs.title")}
              subtitle={c("home.programs.subtitle")}
              description={c("home.programs.description")}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ProgramCard
                title={c("programs.future-ballers.title")}
                age={c("programs.future-ballers.age")}
                description={c("home.program.future-ballers.description")}
                image={futureBallersImage}
                imageAlt={alt("home.future-ballers")}
                href="/programs/future-ballers"
                buttonLabel={cardButton}
              />
              <ProgramCard
                title={c("programs.mini-basket.title")}
                age={c("programs.mini-basket.age")}
                description={c("home.program.mini-basket.description")}
                image={miniBasketImage}
                imageAlt={alt("home.mini-basket")}
                href="/programs/mini-basket"
                buttonLabel={cardButton}
              />
              <ProgramCard
                title={c("programs.youth-academy.title")}
                age={c("programs.youth-academy.age")}
                description={c("home.program.youth-academy.description")}
                image={youthAcademyImage}
                imageAlt={alt("home.youth-academy")}
                href="/programs/youth-academy"
                buttonLabel={cardButton}
              />
              <ProgramCard
                title={c("programs.elite.title")}
                age={c("programs.elite.age")}
                description={c("home.program.elite.description")}
                image={eliteImage}
                imageAlt={alt("home.elite")}
                href="/programs#elite"
                buttonLabel={cardButton}
              />
              <ProgramCard
                title={c("programs.private-training.title")}
                age={c("programs.private-training.age")}
                description={c("home.program.private-training.description")}
                image={privateTrainingImage}
                imageAlt={alt("home.private-training")}
                href="/programs/private-training"
                buttonLabel={cardButton}
              />
            </div>
          </div>
        </section>
      </Reveal>

      {/* METHODOLOGY SECTION */}
      <Reveal>
        <section className="py-20 md:py-32 bg-neutral-900 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 skew-x-12 transform translate-x-20" />
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <SectionHeader 
                  title={c("home.methodology.title")}
                  subtitle={c("home.methodology.subtitle")}
                  description={c("home.methodology.blurb")}
                  dark
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-10">
                  {pillars.map((pillar, idx) => (
                    <div key={idx} className="flex flex-col gap-3">
                      <div className="h-12 w-12 bg-primary/10 flex items-center justify-center rounded-sm text-primary">
                        <pillar.icon className="h-6 w-6" />
                      </div>
                      <h4 className="font-bold uppercase tracking-wide text-lg">{pillar.title}</h4>
                      <p className="text-gray-400 text-sm leading-relaxed">{pillar.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-10">
                  <Link href="/methodology">
                    <Button variant="outline" className="border-white text-white hover:bg-white hover:text-black uppercase font-bold tracking-wider rounded-none px-8 h-12">
                      {c("home.methodology.button")}
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 border-2 border-primary/30 z-0 translate-x-4 translate-y-4" />
                <div className="relative z-10 w-full aspect-[4/3]">
                  <Image 
                    src={methodologyImage} 
                    alt={alt("home.methodology")} 
                    fill
                    className="object-cover transition-all duration-700 shadow-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* MID-PAGE CTA */}
      <Reveal>
        <section className="py-14 bg-black">
          <div className="container mx-auto px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">{c("home.cta-mid.eyebrow")}</p>
              <h3 className="text-2xl md:text-3xl font-black uppercase text-white leading-tight">
                {c("home.cta-mid.headline")}
              </h3>
            </div>
            <Link href="#book-trial" className="shrink-0">
              <Button className="bg-primary hover:bg-orange-600 text-white uppercase font-bold tracking-wider rounded-none px-10 h-12 text-sm transition-colors">
                {c("home.cta-mid.button")} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </Reveal>

      {/* FACILITIES PREVIEW */}
      <Reveal>
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <SectionHeader 
                title={c("home.facilities.title")}
                subtitle={c("home.facilities.subtitle")}
                className="mb-0"
              />
              <Link href="/facilities">
                <div className="flex items-center gap-2 font-bold uppercase tracking-widest text-sm hover:text-primary cursor-pointer transition-colors mb-2">
                  {c("home.facilities.link")} <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            </div>
            <div className="relative w-full h-[500px] overflow-hidden group">
              <Image 
                src={arenaImage} 
                alt={alt("home.arena")} 
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
              <div className="absolute bottom-0 left-0 p-8 md:p-12 text-white">
                <h3 className="text-3xl md:text-5xl font-black uppercase mb-4">{c("home.facilities-preview.title")}</h3>
                <p className="max-w-md text-lg text-gray-200 mb-6">
                  {c("home.facilities-preview.description")}
                </p>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider">{c("home.facilities.tag1")}</span>
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider">{c("home.facilities.tag2")}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* SPAIN CONNECTION — has its own scroll animation; no Reveal wrapper */}
      <SpainConnection
        eyebrow={c("home.spain.eyebrow")}
        title={c("home.spain.title")}
        text={c("home.spain.text")}
        linkText={c("home.spain.link")}
        label1={c("home.spain.label1")}
        label2={c("home.spain.label2")}
      />

      {/* TESTIMONIALS */}
      <Reveal>
        <section className="py-20 bg-white border-t border-gray-100">
          <div className="container mx-auto px-4 md:px-6">
            <SectionHeader title={c("home.testimonials.title")} centered />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              {testimonials.map((t, idx) => (
                <div key={idx} className="bg-gray-50 p-8 relative">
                  <div className="text-primary text-6xl font-serif absolute top-4 left-6 opacity-20">&quot;</div>
                  <p className="relative z-10 text-gray-700 italic text-lg mb-6 leading-relaxed">
                    {t.text}
                  </p>
                  <div>
                    <h5 className="font-bold uppercase text-sm">{t.author}</h5>
                    <span className="text-xs text-gray-500 uppercase tracking-wider">{t.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal><EventStrip /></Reveal>

      {/* BOOK TRIAL SECTION */}
      <Reveal>
        <section id="book-trial" className="py-20 md:py-32 bg-primary relative">
          <div className="absolute inset-0 bg-[url('/images/team-spirit.jpg')] bg-cover bg-center mix-blend-multiply opacity-20" />
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="text-white">
                <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-6">
                  {c("home.book-trial.headline")}
                </h2>
                <p className="text-xl md:text-2xl font-light opacity-90 mb-8 max-w-lg">
                  {c("home.book-trial.subtext")}
                </p>
                <ul className="space-y-4 mb-10">
                  {[1, 2, 3, 4].map((n) => c(`home.book-trial.point${n}`)).map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-lg font-medium">
                      <CheckCircle2 className="h-6 w-6 text-black" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <BookTrialForm heading={c("home.form.heading")} subheading={c("home.form.subheading")} submitLabel={c("home.form.submit")} />
            </div>
          </div>
        </section>
      </Reveal>
    </>
  );
}
