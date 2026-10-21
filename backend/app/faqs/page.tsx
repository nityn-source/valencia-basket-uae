import type { Metadata } from "next";
import Link from "next/link";
import { FAQContent } from "./FAQContent";
import { buildPageMetadata } from "@/lib/seo/resolve";
import { BreadcrumbJsonLd } from "@/components/seo/StructuredData";
import { getVisibleFaqs } from "@/lib/content/faqStore";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("/faqs");
}


export default async function FAQsPage() {
  const faqs = await getVisibleFaqs();
  return (
    <>
      <BreadcrumbJsonLd path="/faqs" label="FAQs" />

      {/* Header */}
      <div className="bg-black text-white py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <span className="text-primary font-bold uppercase tracking-widest text-sm mb-4 block">
            Help &amp; Support
          </span>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-3">
            Frequently Asked Questions
          </h1>
          <p className="text-gray-400 text-lg">Valencia Basket Academy UAE</p>
        </div>
      </div>

      {/* FAQ body */}
      <div className="bg-white py-14 md:py-20">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <FAQContent items={faqs} />

          {/* Still have a question CTA */}
          <div className="mt-16 p-8 bg-gray-50 border-l-4 border-primary">
            <h3 className="font-black uppercase tracking-tight text-gray-900 mb-2">
              Still have a question?
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              We&apos;re happy to help. Reach out directly and we&apos;ll get back to you.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <a
                href="https://wa.me/971544386838"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-primary text-white font-bold uppercase tracking-wider px-5 py-3 hover:bg-orange-600 transition-colors"
              >
                WhatsApp Us
              </a>
              <a
                href="mailto:info@valenciabasket.ae"
                className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 font-bold uppercase tracking-wider px-5 py-3 hover:border-primary hover:text-primary transition-colors"
              >
                Email Us
              </a>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-gray-200">
            <Link
              href="/"
              className="text-sm text-primary hover:underline font-medium uppercase tracking-wider"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
