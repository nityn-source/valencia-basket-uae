"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, Instagram } from "lucide-react";
import { TikTokIcon } from "@/components/shared/TikTokIcon";
import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar({ logoAlt }: { logoAlt: string }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProgramsOpen, setIsProgramsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const updateNavHeight = () => {
      if (navRef.current) {
        const height = navRef.current.offsetHeight;
        document.documentElement.style.setProperty("--navbar-height", `${height}px`);
      }
    };
    updateNavHeight();
    window.addEventListener("resize", updateNavHeight);
    const observer = new MutationObserver(updateNavHeight);
    if (navRef.current) {
      observer.observe(navRef.current, { attributes: true, childList: true, subtree: true });
    }
    return () => {
      window.removeEventListener("resize", updateNavHeight);
      observer.disconnect();
    };
  }, [isScrolled]);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsProgramsOpen(false);
    setIsAboutOpen(false);
  };

  const programs = [
    { name: "Future Ballers (4-6 yrs)", href: "/programs/future-ballers" },
    { name: "Mini Basket (7-10 yrs)", href: "/programs/mini-basket" },
    { name: "Youth Academy (11-18 yrs)", href: "/programs/youth-academy" },
    { name: "Elite / Select", href: "/programs#elite" },
    { name: "Private Training", href: "/programs/private-training" },
  ];

  const aboutItems = [
    { name: "Methodology", href: "/methodology" },
    { name: "Staff", href: "/coaches" },
    { name: "Location", href: "/facilities" },
  ];

  const socialLinks = [
    { name: "WhatsApp", href: "https://wa.me/971544386838?text=Hi!%20I%20visited%20the%20Valencia%20Basket%20Club%20website%20and%20I%E2%80%99m%20interested%20in%20joining.%20Could%20you%20please%20share%20details%20about%20your%20programs%20and%20how%20to%20get%20started%3F", Icon: WhatsAppIcon },
    { name: "TikTok", href: "https://www.tiktok.com/@valenciabasketuae", Icon: TikTokIcon },
    { name: "Instagram", href: "https://www.instagram.com/valenciabasketuae/", Icon: Instagram },
  ];

  const dropdownItemClass =
    "block w-full cursor-pointer font-medium hover:bg-orange-50 hover:text-primary p-2 transition-colors uppercase text-xs tracking-wide";
  const dropdownContentClass =
    "bg-white p-2 rounded-none border-t-2 border-primary shadow-xl";

  return (
    <nav
      ref={navRef}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-[#FF6C0E] shadow-md border-b border-orange-600/20",
        isScrolled ? "py-2" : "py-3 lg:py-4"
      )}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex flex-col items-start group cursor-pointer hover:opacity-90 transition-opacity z-50 relative shrink-0">
          <div className="flex items-center gap-2 lg:gap-3">
            <Image
              src="/images/logo.png"
              width={56}
              height={56}
              alt={logoAlt}
              style={{ width: "auto" }}
              className={cn("transition-all duration-300", isScrolled ? "h-9 lg:h-10" : "h-10 lg:h-14")}
            />
            <div className="flex flex-col">
              <span className={cn("font-black tracking-tighter uppercase leading-none transition-colors text-white", "text-sm lg:text-xl")}>
                Valencia Basket
              </span>
              <span className={cn("font-bold tracking-widest uppercase transition-colors text-white/90", "text-[7px] lg:text-[9px]")}>
                Academy UAE
              </span>
            </div>
          </div>
        </Link>

        {/* ── Desktop nav ── */}
        <div className="hidden lg:flex flex-1 items-center justify-center gap-7 xl:gap-10">

          {/* 1. Programs — label navigates to /programs, chevron opens dropdown */}
          <DropdownMenu>
            <div className="flex items-center">
              <Link
                href="/programs"
                className="text-xs xl:text-sm font-semibold uppercase tracking-wide transition-colors hover:text-black outline-none text-white mr-0.5 whitespace-nowrap"
              >
                Programs
              </Link>
              <DropdownMenuTrigger className="flex items-center text-xs xl:text-sm font-semibold uppercase tracking-wide transition-colors hover:text-black outline-none text-white">
                <ChevronDown className="h-3 w-3 xl:h-4 xl:w-4" />
              </DropdownMenuTrigger>
            </div>
            <DropdownMenuContent className={cn(dropdownContentClass, "w-56")}>
              {programs.map((program) => (
                <DropdownMenuItem key={program.name} asChild>
                  <Link href={program.href} className={dropdownItemClass}>
                    {program.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 2. Events — single link */}
          <Link
            href="/events"
            className="text-xs xl:text-sm font-semibold uppercase tracking-wide transition-colors hover:text-black cursor-pointer text-white whitespace-nowrap"
          >
            Events
          </Link>

          {/* 3. About — dropdown trigger only, no navigation */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-0.5 text-xs xl:text-sm font-semibold uppercase tracking-wide transition-colors hover:text-black outline-none text-white whitespace-nowrap">
              About
              <ChevronDown className="h-3 w-3 xl:h-4 xl:w-4 ml-0.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className={cn(dropdownContentClass, "w-48")}>
              {aboutItems.map((item) => (
                <DropdownMenuItem key={item.name} asChild>
                  <Link href={item.href} className={dropdownItemClass}>
                    {item.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 4. Contact Us — single link */}
          <Link
            href="/contact"
            className="text-xs xl:text-sm font-semibold uppercase tracking-wide transition-colors hover:text-black cursor-pointer text-white whitespace-nowrap"
          >
            Contact Us
          </Link>
        </div>

        {/* Right-side: socials + CTA + hamburger */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Social icons — desktop only */}
          <div className="hidden xl:flex items-center gap-4 border-l border-white/25 pl-5 ml-3 mr-3 self-center">
            {socialLinks.map(({ name, href, Icon }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={name}
                className="text-white hover:opacity-70 hover:scale-110 transition-all duration-200 flex items-center"
                data-testid={`link-header-social-${name.toLowerCase()}`}
              >
                <Icon className="h-5 w-5" strokeWidth={2} />
              </a>
            ))}
          </div>

          {/* Book a Free Trial button */}
          <Link href="/#book-trial" className="hidden md:block">
            <Button
              size="sm"
              className={cn(
                "hidden md:flex uppercase font-bold tracking-wider rounded-none transition-all duration-300 h-8 lg:h-9 px-3 lg:px-4 text-[10px] lg:text-xs whitespace-nowrap",
                "bg-black text-white hover:bg-white hover:text-primary border border-black hover:border-transparent"
              )}
            >
              Book a Free Trial
            </Button>
          </Link>

          {/* Social icons — mobile header row */}
          <div className="lg:hidden flex items-center gap-0 mr-1">
            {socialLinks.map(({ name, href, Icon }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={name}
                className="h-10 w-10 flex items-center justify-center text-white hover:opacity-70 transition-opacity"
                data-testid={`link-mobile-header-social-${name.toLowerCase()}`}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
              </a>
            ))}
          </div>

          {/* Hamburger */}
          <button
            className="lg:hidden text-white z-50 relative"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
            onClick={() => {
              if (isMobileMenuOpen) {
                closeMobileMenu();
              } else {
                setIsMobileMenuOpen(true);
              }
            }}
          >
            {isMobileMenuOpen ? (
              <X className="h-8 w-8 text-black" />
            ) : (
              <Menu className="h-8 w-8 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile menu overlay ── */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-white z-40 pt-24 px-6 flex flex-col gap-0 animate-in slide-in-from-top-5 overflow-y-auto">

          {/* 1. Programs — accordion: expand on first tap, navigate on second tap */}
          <div className="border-b border-gray-100">
            <div className="flex items-stretch">
              <button
                className="flex-1 text-left text-2xl font-black uppercase text-gray-900 hover:text-primary transition-colors py-4 pr-2 min-h-[56px] flex items-center"
                onClick={() => {
                  if (isProgramsOpen) {
                    router.push("/programs");
                    closeMobileMenu();
                  } else {
                    setIsProgramsOpen(true);
                  }
                }}
              >
                Programs
              </button>
              <button
                aria-label={isProgramsOpen ? "Close programs submenu" : "Open programs submenu"}
                className="flex items-center justify-center w-14 min-h-[56px] text-gray-900 hover:text-primary transition-colors shrink-0"
                onClick={() => setIsProgramsOpen((prev) => !prev)}
              >
                <ChevronDown
                  className={cn(
                    "h-6 w-6 transition-transform duration-300",
                    isProgramsOpen && "rotate-180"
                  )}
                />
              </button>
            </div>
            <div
              className={cn(
                "grid transition-all duration-300 ease-in-out",
                isProgramsOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <div className="overflow-hidden">
                <div className="flex flex-col pb-3 pl-2">
                  {programs.map((program) => (
                    <Link
                      key={program.name}
                      href={program.href}
                      className="text-base font-bold uppercase text-gray-700 hover:text-primary transition-colors py-3 px-3 border-l-2 border-[#FF6C0E]/40 hover:border-[#FF6C0E] min-h-[44px] flex items-center"
                      onClick={closeMobileMenu}
                    >
                      {program.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Events — single link */}
          <Link
            href="/events"
            className="text-2xl font-black uppercase text-gray-900 cursor-pointer hover:text-primary transition-colors border-b border-gray-100 py-4 min-h-[56px] flex items-center"
            onClick={closeMobileMenu}
          >
            Events
          </Link>

          {/* 3. About — accordion: label and chevron both toggle (no navigation) */}
          <div className="border-b border-gray-100">
            <div className="flex items-stretch">
              <button
                className="flex-1 text-left text-2xl font-black uppercase text-gray-900 hover:text-primary transition-colors py-4 pr-2 min-h-[56px] flex items-center"
                onClick={() => setIsAboutOpen((prev) => !prev)}
              >
                About
              </button>
              <button
                aria-label={isAboutOpen ? "Close about submenu" : "Open about submenu"}
                className="flex items-center justify-center w-14 min-h-[56px] text-gray-900 hover:text-primary transition-colors shrink-0"
                onClick={() => setIsAboutOpen((prev) => !prev)}
              >
                <ChevronDown
                  className={cn(
                    "h-6 w-6 transition-transform duration-300",
                    isAboutOpen && "rotate-180"
                  )}
                />
              </button>
            </div>
            <div
              className={cn(
                "grid transition-all duration-300 ease-in-out",
                isAboutOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <div className="overflow-hidden">
                <div className="flex flex-col pb-3 pl-2">
                  {aboutItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="text-base font-bold uppercase text-gray-700 hover:text-primary transition-colors py-3 px-3 border-l-2 border-[#FF6C0E]/40 hover:border-[#FF6C0E] min-h-[44px] flex items-center"
                      onClick={closeMobileMenu}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Contact Us — single link */}
          <Link
            href="/contact"
            className="text-2xl font-black uppercase text-gray-900 cursor-pointer hover:text-primary transition-colors border-b border-gray-100 py-4 min-h-[56px] flex items-center"
            onClick={closeMobileMenu}
          >
            Contact Us
          </Link>

          <Link href="/#book-trial" onClick={closeMobileMenu} className="mt-6">
            <Button className="w-full uppercase font-bold rounded-none bg-primary text-white h-14 text-lg">
              Book a Free Trial
            </Button>
          </Link>
        </div>
      )}
    </nav>
  );
}
