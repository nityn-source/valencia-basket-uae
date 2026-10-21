"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function AdmissionsClient({ t }: { t: Record<string, string> }) {
  const faqs = [1, 2, 3, 4, 5].map((n) => ({ q: t[`admissions.faq${n}.q`], a: t[`admissions.faq${n}.a`] }));

  return (
    <>
       <div className="bg-black text-white py-20">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6">{t["admissions.hero.title"]}</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            {t["admissions.hero.subtext"]}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            <div className="lg:col-span-2">
                <h2 className="text-3xl font-black uppercase mb-8">{t["admissions.join.heading"]}</h2>
                
                <div className="relative border-l-2 border-gray-200 ml-3 md:ml-6 space-y-12">
                    <div className="relative pl-8 md:pl-12">
                        <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary border-4 border-white shadow-sm" />
                        <h3 className="text-xl font-bold uppercase mb-2">{t["admissions.step1.title"]}</h3>
                        <p className="text-gray-600">{t["admissions.step1.description"]}</p>
                        <Link href="/#book-trial"><Button className="uppercase font-bold tracking-wider rounded-none h-12 px-8 mt-2">{t["admissions.step1.button"]}</Button></Link>
                    </div>
                     <div className="relative pl-8 md:pl-12">
                        <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary border-4 border-white shadow-sm" />
                        <h3 className="text-xl font-bold uppercase mb-2">{t["admissions.step2.title"]}</h3>
                        <p className="text-gray-600">{t["admissions.step2.description"]}</p>
                    </div>
                     <div className="relative pl-8 md:pl-12">
                        <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary border-4 border-white shadow-sm" />
                        <h3 className="text-xl font-bold uppercase mb-2">{t["admissions.step3.title"]}</h3>
                        <p className="text-gray-600">{t["admissions.step3.description"]}</p>
                    </div>
                     <div className="relative pl-8 md:pl-12">
                        <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary border-4 border-white shadow-sm" />
                        <h3 className="text-xl font-bold uppercase mb-2">{t["admissions.step4.title"]}</h3>
                        <p className="text-gray-600">{t["admissions.step4.description"]}</p>
                    </div>
                </div>

                <div className="mt-20">
                    <h2 className="text-3xl font-black uppercase mb-8">{t["admissions.faq.heading"]}</h2>
                    <Accordion type="single" collapsible className="w-full">
                        {faqs.map((faq, i) => (
                            <AccordionItem key={i} value={`item-${i}`}>
                                <AccordionTrigger className="font-bold text-left">{faq.q}</AccordionTrigger>
                                <AccordionContent className="text-gray-600">
                                {faq.a}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </div>

            <div className="bg-gray-50 p-8 h-fit border-t-4 border-primary">
                <h3 className="text-xl font-black uppercase mb-6">{t["admissions.terms.heading"]}</h3>
                
                <div className="space-y-6 mb-8">
                    <div>
                        <span className="block text-xs font-bold uppercase text-gray-400">{t["admissions.term1.label"]}</span>
                        <p className="font-bold">{t["admissions.term1.dates"]}</p>
                    </div>
                    <div>
                        <span className="block text-xs font-bold uppercase text-gray-400">{t["admissions.term2.label"]}</span>
                        <p className="font-bold">{t["admissions.term2.dates"]}</p>
                    </div>
                    <div>
                        <span className="block text-xs font-bold uppercase text-gray-400">{t["admissions.term3.label"]}</span>
                        <p className="font-bold">{t["admissions.term3.dates"]}</p>
                    </div>
                </div>

                <Link href="/#book-trial">
                    <Button className="w-full uppercase font-bold tracking-wider rounded-none h-12">
                        {t["admissions.terms.button"]}
                    </Button>
                </Link>
                <p className="text-xs text-center text-gray-400 mt-4">
                    {t["admissions.terms.note"]}
                </p>
            </div>
        </div>
      </div>
    </>
  );
}
