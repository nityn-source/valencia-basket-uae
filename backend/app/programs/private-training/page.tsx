import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Check, Clock, User } from "lucide-react";
import type { Metadata } from "next";
import { buildPageMetadata, getAltResolver } from "@/lib/seo/resolve";
import { BreadcrumbJsonLd } from "@/components/seo/StructuredData";
import { getContentGetter } from "@/lib/content/pageContent";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("/programs/private-training");
}

export default async function PrivateTraining() {
  const alt = await getAltResolver();
  const c = await getContentGetter();
  const heroImage = c("program.private-training.image");
  const benefits = [1, 2, 3, 4, 5].map((n) => c(`private-training.benefit${n}`));
  const formats = [1, 2, 3, 4].map((n) => ({
    ratio: c(`private-training.format${n}.ratio`),
    label: c(`private-training.format${n}.label`),
    desc: c(`private-training.format${n}.desc`),
  }));
  const coaches = [1, 2].map((n) => ({
    name: c(`private-training.coach${n}.name`),
    role: c(`private-training.coach${n}.role`),
    bio: c(`private-training.coach${n}.bio`),
  }));

  return (
    <>
      <BreadcrumbJsonLd path="/programs/private-training" label="Private Training" />
      <div className="bg-black text-white py-20">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6">{c("private-training.hero.title")}</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            {c("private-training.hero.subtext")}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-20">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20 items-center">
          <div>
            <span className="text-[#FF6C0E] font-bold uppercase tracking-widest text-sm mb-2 block">{c("private-training.about.eyebrow")}</span>
            <h2 className="text-4xl font-black uppercase mb-6">{c("private-training.about.title")}</h2>
            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
              {c("private-training.about.paragraph")}
            </p>
            <ul className="space-y-4">
              {benefits.map((benefit, i) => (
                <li key={i} className="flex items-center gap-3 font-medium text-gray-800">
                  <div className="h-6 w-6 rounded-full bg-[#FF6C0E]/10 flex items-center justify-center text-[#FF6C0E]">
                    <Check className="h-4 w-4" />
                  </div>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="relative w-full aspect-[4/3]">
              <Image
                src={heroImage}
                alt={alt("private-training.session")}
                fill
                className="object-cover shadow-2xl rounded-sm"
              />
            </div>
          </div>
        </div>

        {/* ── Ratio / Format Cards ── */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <span className="text-[#FF6C0E] font-bold uppercase tracking-widest text-sm mb-2 block">
              {c("private-training.format.eyebrow")}
            </span>
            <h2 className="text-4xl font-black uppercase mb-4">{c("private-training.format.title")}</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              {c("private-training.format.description")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {formats.map(({ ratio, label, desc }) => (
              <div
                key={ratio}
                className="bg-white border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col group"
              >
                {/* Orange top accent bar */}
                <div className="h-[3px] w-8 bg-[#FF6C0E] mb-5 group-hover:w-full transition-all duration-500" aria-hidden="true" />

                {/* Ratio */}
                <div className="text-[42px] font-black leading-none tracking-tighter text-gray-900 group-hover:text-[#FF6C0E] transition-colors duration-300 mb-1">
                  {ratio}
                </div>

                {/* Label */}
                <div className="text-xs font-bold uppercase tracking-widest text-[#FF6C0E] mb-3">
                  {label}
                </div>

                {/* Divider */}
                <div className="h-px bg-gray-100 mb-4" />

                {/* Description */}
                <p className="text-sm text-gray-500 leading-relaxed flex-1">
                  {desc}
                </p>
              </div>
            ))}
          </div>

          {/* Enquiry nudge */}
          <p className="text-center text-sm text-gray-400 mt-6">
            {c("private-training.format.nudge.before")}{" "}
            <a href="/contact" className="text-[#FF6C0E] font-medium hover:underline">
              {c("private-training.format.nudge.link")}
            </a>{" "}
            {c("private-training.format.nudge.after")}
          </p>
        </div>

        <div className="bg-gray-100 p-8 md:p-12">
           <div className="flex flex-col md:flex-row gap-12 items-start">
              <div className="flex-1">
                 <h2 className="text-3xl font-black uppercase mb-6 flex items-center gap-3">
                   <Clock className="h-8 w-8 text-[#FF6C0E]" /> {c("private-training.availability.title")}
                 </h2>
                 <p className="text-gray-600 mb-6">
                   {c("private-training.availability.description")}
                 </p>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                       <span className="font-bold text-gray-900">{c("private-training.schedule.weekdays.label")}</span>
                       <span className="text-gray-600">{c("private-training.schedule.weekdays")}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                       <span className="font-bold text-gray-900">{c("private-training.schedule.saturday.label")}</span>
                       <span className="text-gray-600">{c("private-training.schedule.saturday")}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                       <span className="font-bold text-gray-900">{c("private-training.schedule.friday.label")}</span>
                       <span className="text-gray-600 text-red-500 font-bold uppercase text-xs">{c("private-training.schedule.friday")}</span>
                    </div>
                 </div>
              </div>
              
              <div className="flex-1">
                 <h2 className="text-3xl font-black uppercase mb-6 flex items-center gap-3">
                   <User className="h-8 w-8 text-[#FF6C0E]" /> {c("private-training.coaches.title")}
                 </h2>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {coaches.map((coach) => (
                      <div key={coach.name} className="bg-white p-4 shadow-sm border border-gray-200">
                        <h4 className="font-black uppercase text-lg">{coach.name}</h4>
                        <span className="text-xs text-[#FF6C0E] font-bold uppercase block mb-2">{coach.role}</span>
                        <p className="text-xs text-gray-500">{coach.bio}</p>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>

      </div>
    </>
  );
}
