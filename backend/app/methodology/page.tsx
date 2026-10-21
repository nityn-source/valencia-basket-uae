import { SectionHeader } from "@/components/shared/SectionHeader";
import { Zap, Target, Users, ArrowRight, Shield, Clock, Crosshair, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import { buildPageMetadata, getAltResolver } from "@/lib/seo/resolve";
import { BreadcrumbJsonLd } from "@/components/seo/StructuredData";
import { getContentGetter } from "@/lib/content/pageContent";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("/methodology");
}

export default async function Methodology() {
  const alt = await getAltResolver();
  const c = await getContentGetter();
  const methodologyImage = c("methodology.image");
  const trainingMethods = [1, 2, 3].map((n) => ({
    number: c(`methodology.method${n}.number`),
    title: c(`methodology.method${n}.title`),
    desc: c(`methodology.method${n}.desc`),
  }));

  const tacticalIcons = [Zap, Crosshair, Target, TrendingUp];
  const tacticalPrinciples = tacticalIcons.map((icon, i) => ({
    icon,
    title: c(`methodology.tactical${i + 1}.title`),
    desc: c(`methodology.tactical${i + 1}.desc`),
  }));

  const developmentIcons = [Clock, Target, Users, Shield];
  const developmentPrinciples = developmentIcons.map((icon, i) => ({
    icon,
    title: c(`methodology.dev${i + 1}.title`),
    desc: c(`methodology.dev${i + 1}.desc`),
  }));

  return (
    <>
      <BreadcrumbJsonLd path="/methodology" label="Methodology" />
      <div className="bg-black text-white py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/10 -skew-x-12 translate-x-1/4" />
        <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
          <span className="text-primary font-bold uppercase tracking-widest text-sm mb-4 block">{c("methodology.hero.eyebrow")}</span>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6">{c("methodology.hero.title")}</h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            {c("methodology.hero.subtext")}
          </p>
        </div>
      </div>

      <section className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <SectionHeader
                title={c("methodology.how-we-train.title")}
                subtitle={c("methodology.how-we-train.subtitle")}
                description={c("methodology.how-we-train.description")}
              />
              <p className="text-gray-600 leading-relaxed mt-6">
                {c("methodology.how-we-train.paragraph")}
              </p>
            </div>

            <div className="space-y-6">
              {trainingMethods.map((method) => (
                <div key={method.number} className="flex gap-6 group p-6 bg-gray-50 hover:bg-primary/5 border-l-4 border-transparent hover:border-primary transition-all duration-300">
                  <div className="font-black text-5xl text-gray-200 group-hover:text-primary transition-colors shrink-0">
                    {method.number}
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase mb-2">{method.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{method.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-neutral-900 text-white">
        <div className="container mx-auto px-4 md:px-6">
          <SectionHeader
            title={c("methodology.tactical.title")}
            subtitle={c("methodology.tactical.subtitle")}
            description={c("methodology.tactical.description")}
            centered
            dark
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            {tacticalPrinciples.map((principle, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 p-8 hover:border-primary/50 transition-all duration-300 group">
                <div className="h-14 w-14 bg-primary/10 flex items-center justify-center rounded-sm text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  <principle.icon className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-black uppercase mb-4">{principle.title}</h3>
                <p className="text-gray-400 leading-relaxed">{principle.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="relative w-full aspect-[4/3]">
                <Image
                  src={methodologyImage}
                  alt={alt("methodology.spain")}
                  fill
                  className="object-cover transition-all duration-700 shadow-2xl"
                />
                <div className="absolute -bottom-4 -right-4 bg-primary text-white px-6 py-3 font-black uppercase text-sm tracking-wider z-10">
                  {c("methodology.long-term.badge")}
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <SectionHeader
                title={c("methodology.long-term.title")}
                subtitle={c("methodology.long-term.subtitle")}
                description={c("methodology.long-term.description")}
              />

              <div className="space-y-8 mt-8">
                {developmentPrinciples.map((principle, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="h-10 w-10 bg-primary/10 flex items-center justify-center rounded-sm text-primary shrink-0 mt-1">
                      <principle.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold uppercase text-lg mb-1">{principle.title}</h4>
                      <p className="text-gray-600 text-sm leading-relaxed">{principle.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-primary py-16">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-black uppercase text-white mb-4">{c("methodology.cta.title")}</h2>
          <p className="text-white/80 max-w-xl mx-auto mb-8 text-lg">
            {c("methodology.cta.subtext")}
          </p>
          <Link href="/#book-trial">
            <Button size="lg" className="uppercase font-bold tracking-wider rounded-none bg-black text-white hover:bg-white hover:text-primary border-0 h-14 px-10">
              {c("methodology.cta.button")} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
