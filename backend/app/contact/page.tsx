import type { Metadata } from "next";
import { MapPin, Mail, Instagram, Facebook, Linkedin } from "lucide-react";
import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";
import { TikTokIcon } from "@/components/shared/TikTokIcon";
import { BookTrialForm } from "@/components/home/BookTrialForm";
import { buildPageMetadata } from "@/lib/seo/resolve";
import { BreadcrumbJsonLd } from "@/components/seo/StructuredData";
import { getContentGetter } from "@/lib/content/pageContent";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("/contact");
}

const MAPS_URL = "https://www.google.com/maps/search/?api=1&query=AllSports+Arena+Al+Quoz+Dubai";
const MAPS_EMBED_URL = "https://www.google.com/maps?q=AllSports+Arena+Al+Quoz+Dubai&output=embed";
const WHATSAPP_URL =
  "https://wa.me/971544386838?text=Hi%2C%20I%27d%20like%20to%20know%20more%20about%20Valencia%20Basket%20Academy.";


const infoRows = [
  {
    Icon: WhatsAppIcon,
    label: "WhatsApp / Phone",
    value: "+971 54 438 6838",
    href: WHATSAPP_URL,
    external: true,
    testid: "link-contact-whatsapp",
  },
  {
    Icon: Mail,
    label: "Email",
    value: "info@valenciabasket.ae",
    href: "mailto:info@valenciabasket.ae",
    external: false,
    testid: "link-contact-email",
  },
  {
    Icon: MapPin,
    label: "Venue",
    value: "Hadaeq Mohammed Bin Rashid, AllSports Arena, Latifa Bint Hamdan St, Al Quoz Ind. First, Dubai, United Arab Emirates",
    href: MAPS_URL,
    external: true,
    testid: "link-contact-venue",
  },
];

export default async function Contact() {
  const c = await getContentGetter();
  const infoLabels: Record<string, string> = {
    "link-contact-whatsapp": c("contact.info.whatsapp-label"),
    "link-contact-email": c("contact.info.email-label"),
    "link-contact-venue": c("contact.info.venue-label"),
  };
  return (
    <>
      <BreadcrumbJsonLd path="/contact" label="Contact" />

      {/* ============ HERO ============ */}
      <div className="bg-black text-white py-20">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <span className="inline-block bg-primary text-white text-xs font-bold uppercase tracking-widest py-1.5 px-4 rounded-full mb-6">
            {c("contact.hero.badge")}
          </span>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">{c("contact.hero.title")}</h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
            {c("contact.hero.subtext")}
          </p>
        </div>
      </div>

      {/* ============ TWO-COLUMN BODY ============ */}
      <div className="container mx-auto px-4 md:px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          {/* Contact info — dark panel (first on mobile) */}
          <div className="bg-black text-white p-8 md:p-10">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-8">{c("contact.info.heading")}</h2>

            <ul className="space-y-6 mb-10">
              {infoRows.map(({ Icon, label, value, href, external, testid }) => (
                <li key={label}>
                  <a
                    href={href}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="flex items-start gap-4 group"
                    data-testid={testid}
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
                        {infoLabels[testid] ?? label}
                      </span>
                      <span className="block text-base font-medium group-hover:text-primary transition-colors">
                        {value}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            <div className="mb-10">
              <span className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
                {c("contact.info.follow")}
              </span>
              <div className="flex items-center gap-3">
                <a
                  href="https://www.instagram.com/valenciabasketuae"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="p-2 bg-neutral-800 hover:bg-primary transition-colors text-white rounded-full"
                  data-testid="link-contact-social-instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="https://www.tiktok.com/@valenciabasketuae"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok"
                  className="p-2 bg-neutral-800 hover:bg-primary transition-colors text-white rounded-full"
                  data-testid="link-contact-social-tiktok"
                >
                  <TikTokIcon className="h-5 w-5" />
                </a>
                <a
                  href="https://www.facebook.com/profile.php?id=61587608243652"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="p-2 bg-neutral-800 hover:bg-primary transition-colors text-white rounded-full"
                  data-testid="link-contact-social-facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href="https://www.linkedin.com/company/valencia-basket-academy-uae/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="p-2 bg-neutral-800 hover:bg-primary transition-colors text-white rounded-full"
                  data-testid="link-contact-social-linkedin"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="p-2 bg-neutral-800 hover:bg-primary transition-colors text-white rounded-full"
                  data-testid="link-contact-social-whatsapp"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                </a>
              </div>
            </div>

            <div className="aspect-[4/3] w-full overflow-hidden rounded-sm">
              <iframe
                src={MAPS_EMBED_URL}
                title="AllSports Arena on Google Maps"
                className="h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>

          {/* General enquiry form — white panel */}
          <BookTrialForm sourcePage="contact" heading={c("contact.form.heading")} subheading={c("contact.form.subheading")} submitLabel={c("contact.form.submit")} />
        </div>
      </div>
    </>
  );
}
