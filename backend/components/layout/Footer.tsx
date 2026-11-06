import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Linkedin, MapPin, Mail, Phone, Youtube } from "lucide-react";
import { TikTokIcon } from "@/components/shared/TikTokIcon";
import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";

export function Footer({ logoAlt }: { logoAlt: string }) {
  return (
    <footer className="bg-neutral-900 text-white pt-20 pb-10 border-t border-neutral-800">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <div className="flex flex-col items-start">
               <Image src="/images/logo.png" width={56} height={56} alt={logoAlt} style={{ width: "auto" }} className="h-14 mb-4" />
              <span className="text-xl font-black tracking-tighter uppercase leading-none text-white">
                Valencia Basket
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase text-primary">
                Academy UAE
              </span>
            </div>
            <p className="text-neutral-400 text-sm leading-relaxed max-w-xs">
              Bringing the elite Spanish basketball methodology to the UAE. 
              Developing players with excellence, humility, and passion.
            </p>
            <div className="flex gap-4">
              <a href="https://www.tiktok.com/@valenciabasketuae" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="p-2 bg-neutral-800 hover:bg-primary transition-colors text-white rounded-full">
                <TikTokIcon className="h-5 w-5" />
              </a>
              <a href="https://www.instagram.com/valenciabasketuae/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="p-2 bg-neutral-800 hover:bg-primary transition-colors text-white rounded-full">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://www.facebook.com/profile.php?id=61587608243652" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="p-2 bg-neutral-800 hover:bg-primary transition-colors text-white rounded-full">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://www.youtube.com/@ValenciaBasketuae" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="p-2 bg-neutral-800 hover:bg-primary transition-colors text-white rounded-full">
                <Youtube className="h-5 w-5" />
              </a>
              <a href="https://www.linkedin.com/company/valencia-basket-academy-uae/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="p-2 bg-neutral-800 hover:bg-primary transition-colors text-white rounded-full">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="https://wa.me/971544386838?text=Hi%2C%20I%27d%20like%20to%20know%20more%20about%20Valencia%20Basket%20Academy." target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" data-testid="link-footer-social-whatsapp" className="p-2 bg-neutral-800 hover:bg-primary transition-colors text-white rounded-full">
                <WhatsAppIcon className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold uppercase tracking-wider mb-6 text-sm">Explore</h4>
            <ul className="space-y-3 text-sm text-neutral-400">
              <li><Link href="/programs" className="hover:text-primary transition-colors cursor-pointer">Programs</Link></li>
              <li><Link href="/coaches" className="hover:text-primary transition-colors cursor-pointer">Staff</Link></li>
              <li><Link href="/facilities" className="hover:text-primary transition-colors cursor-pointer">Facilities</Link></li>
              <li><Link href="/events" className="hover:text-primary transition-colors cursor-pointer">Events &amp; Camps</Link></li>
               <li><Link href="/blog" className="hover:text-primary transition-colors cursor-pointer">Blog</Link></li>
              <li><Link href="/admissions" className="hover:text-primary transition-colors cursor-pointer">Admissions</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold uppercase tracking-wider mb-6 text-sm">About</h4>
            <ul className="space-y-3 text-sm text-neutral-400">
              <li><Link href="/methodology" className="hover:text-primary transition-colors cursor-pointer">Methodology</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors cursor-pointer">Terms &amp; Conditions</Link></li>
              <li><Link href="/faqs" className="hover:text-primary transition-colors cursor-pointer">FAQs</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors cursor-pointer">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold uppercase tracking-wider mb-6 text-sm">Get In Touch</h4>
            <ul className="space-y-4 text-sm text-neutral-400">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <a
                  href="https://www.google.com/maps/search/?api=1&query=AllSports+Arena+Al+Quoz+Dubai"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open AllSports Arena location in Google Maps"
                  className="hover:text-white cursor-pointer transition-colors"
                  data-testid="link-footer-address"
                >
                  Hadaeq Mohammed Bin Rashid, AllSports Arena,<br />Latifa Bint Hamdan St, Al Quoz Ind. First,<br />Dubai, United Arab Emirates
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <a href="mailto:info@valenciabasket.ae" className="hover:text-white">info@valenciabasket.ae</a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <a href="tel:+971544386838" className="hover:text-white">+971 54 438 6838</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500 uppercase tracking-widest">
          <span>&copy; {new Date().getFullYear()} Valencia Basket UAE. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/privacy-policy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-primary transition-colors">
              Terms &amp; Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
