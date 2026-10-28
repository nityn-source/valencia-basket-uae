import { SectionHeader } from "@/components/shared/SectionHeader";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { buildPageMetadata, getAltResolver } from "@/lib/seo/resolve";
import { BreadcrumbJsonLd } from "@/components/seo/StructuredData";
import { getContentGetter } from "@/lib/content/pageContent";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("/programs");
}

export default async function Programs() {
  const alt = await getAltResolver();
  const c = await getContentGetter();
  const futureBallersImage = c("program.future-ballers.image");
  const miniBasketImage = c("program.mini-basket.image");
  const youthAcademyImage = c("program.youth-academy.image");
  const eliteImage = c("program.elite.image");
  const programDefs = [
    {
      id: "future-ballers",
      slug: "future-ballers",
      image: futureBallersImage,
      imageKey: "programs.future-ballers",
      detailHref: "/programs/future-ballers",
    },
    {
      id: "mini",
      slug: "mini-basket",
      image: miniBasketImage,
      imageKey: "programs.mini-basket",
      detailHref: "/programs/mini-basket",
    },
    {
      id: "youth",
      slug: "youth-academy",
      image: youthAcademyImage,
      imageKey: "programs.youth-academy",
      detailHref: "/programs/youth-academy",
    },
    {
      id: "elite",
      slug: "elite",
      image: eliteImage,
      imageKey: "programs.elite",
      detailHref: "",
    },
  ];
  const programs = programDefs.map(({ slug, ...def }) => ({
    ...def,
    title: c(`programs.${slug}.title`),
    age: c(`programs.${slug}.age`),
    focus: c(`programs.${slug}.focus`),
    desc: c(`programs.${slug}.description`),
    features: [1, 2, 3, 4].map((n) => c(`programs.${slug}.feature${n}`)),
  }));
  const privateTrainingImage = c("program.private-training.image");

  return (
    <>
      <BreadcrumbJsonLd path="/programs" label="Programs" />
      <div className="bg-black text-white py-20">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6">
            <span className="block">{c("programs.hero.line1")}</span>
            <span className="block">{c("programs.hero.line2")}</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            {c("programs.intro")}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-20">
        <div className="space-y-20">
          {programs.map((program, idx) => (
            <div key={program.id} id={program.id} className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center border-b border-gray-100 pb-20 last:border-0 last:pb-0">
              <div className={`order-2 ${idx % 2 === 1 ? "md:order-1" : "md:order-2"}`}>
                {(() => {
                  const photo = (
                    <div className="aspect-video w-full rounded-sm overflow-hidden relative group shadow-xl">
                      <Image
                        src={program.image}
                        alt={alt(program.imageKey)}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                  );
                  return program.detailHref ? (
                    <Link href={program.detailHref} className="block" tabIndex={-1} aria-hidden="true">
                      {photo}
                    </Link>
                  ) : (
                    photo
                  );
                })()}
              </div>
              
              <div className={`order-1 ${idx % 2 === 1 ? "md:order-2" : "md:order-1"}`}>
                <div className="inline-block py-1 px-3 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest mb-4">
                  {program.age}
                </div>
                <h2 className="text-4xl font-black uppercase mb-2">
                  {program.detailHref ? (
                    <Link href={program.detailHref} className="transition-colors hover:text-primary">
                      {program.title}
                    </Link>
                  ) : (
                    program.title
                  )}
                </h2>
                <h3 className="text-lg font-bold text-gray-500 mb-6">{program.focus}</h3>
                <p className="text-gray-600 mb-8 leading-relaxed text-lg">
                  {program.desc}
                </p>
                
                <div className="mb-8">
                  <h4 className="font-bold uppercase text-sm mb-4 border-b pb-2">{c("programs.focus-heading")}</h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {program.features.map((feat, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Check className="h-4 w-4 text-primary" /> {feat}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-start">
                   {program.detailHref ? (
                     <Link href={program.detailHref}>
                      <Button className="rounded-none uppercase font-bold tracking-wider h-auto py-3">
                        {c("programs.learn-more")} <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                     </Link>
                   ) : (
                     <Link href="/#book-trial">
                      <Button className="rounded-none uppercase font-bold tracking-wider h-auto py-3">
                        {c("programs.book-trial")} <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                     </Link>
                   )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* PRIVATE TRAINING SECTION */}
      <section className="py-20 bg-gray-50 border-t-8 border-primary">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block py-1 px-3 bg-primary text-white rounded-full text-xs font-bold uppercase tracking-widest mb-4">
                {c("programs.private-training.badge")}
              </div>
              <h2 className="text-5xl font-black uppercase mb-4">
                <Link href="/programs/private-training" className="transition-colors hover:text-primary">
                  {c("programs.private-training.title")}
                </Link>
              </h2>
              <h3 className="text-xl font-bold text-primary mb-6">{c("programs.private-training.subtitle")}</h3>
              <p className="text-gray-600 mb-8 leading-relaxed text-lg">
                {c("programs.private-training.description")}
              </p>
              
              <div className="mb-8">
                <h4 className="font-bold uppercase text-sm mb-4 border-b pb-2">{c("programs.private-training.options-heading")}</h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((n) => (
                    <li key={n} className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Check className="h-4 w-4 text-primary" /> {c(`programs.private-training.option${n}`)}
                    </li>
                  ))}
                </ul>
              </div>

              <Link href="/programs/private-training">
                <Button className="rounded-none uppercase font-bold tracking-wider h-auto py-4 px-8 text-lg">
                  {c("programs.private-training.button")} <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            
            <div className="relative">
              <div className="absolute -inset-4 border-2 border-primary/30 z-0 translate-x-4 translate-y-4" />
              <div className="relative z-10 w-full aspect-[4/3]">
                <Image 
                  src={privateTrainingImage} 
                  alt={alt("programs.private-training")} 
                  fill
                  className="object-cover shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-primary py-20 text-white text-center">
        <div className="container mx-auto px-4">
           <h2 className="text-4xl font-black uppercase mb-6">{c("programs.not-sure.title")}</h2>
           <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">{c("programs.not-sure.description")}</p>
           <Link href="/#book-trial">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary uppercase font-bold tracking-wider rounded-none px-10 h-14 text-lg">
                {c("programs.not-sure.button")}
              </Button>
           </Link>
        </div>
      </section>
    </>
  );
}
