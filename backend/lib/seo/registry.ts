/**
 * Central registry of code-defined SEO defaults for the public pages.
 *
 * These values mirror exactly what each page used to declare inline. The SEO
 * Manager stores only *overrides*; whenever an override field is blank the
 * value below is used, so removing every override restores the original
 * behaviour byte-for-byte.
 */

export interface PageSeoDefaults {
  /** Route path, used as the primary key for overrides. */
  path: string;
  /** Human label for the admin UI. */
  label: string;
  /** Grouping for the admin UI. */
  group: "Main" | "Programs" | "Events" | "Legal";
  /** Absolute <title> (the root template is not applied to these). */
  title: string;
  description: string;
  /** Canonical path (relative to metadataBase). */
  canonical: string;
  /** Falls back to `title` when omitted. */
  ogTitle?: string;
  /** Falls back to `description` when omitted. */
  ogDescription?: string;
  /** Code-level default for robots noindex. */
  noIndex?: boolean;
  /**
   * Code-level "nofollow" for pages that should not pass link equity either.
   * Not admin-editable — it belongs to the page's purpose, not its copy.
   */
  noFollow?: boolean;
}

export const PAGE_SEO_DEFAULTS: PageSeoDefaults[] = [
  {
    path: "/",
    label: "Home",
    group: "Main",
    title: "Basketball Academy in Dubai | Valencia Basket UAE",
    description:
      "Valencia Basket UAE brings world-class Spanish basketball methodology to Dubai. Youth basketball academy offering programs for ages 4-18. Join now!",
    canonical: "/",
  },
  {
    path: "/programs",
    label: "Programs",
    group: "Programs",
    title:
      "Basketball Training Programs for Kids & Youth (4-18 yrs) in Dubai | Valencia Basket",
    description:
      "From first dribbles to professional pathways, explore our basketball programs for Future Ballers, Mini Basket, Youth, Elite & Private Training. Join now!",
    canonical: "/programs",
  },
  {
    path: "/programs/future-ballers",
    label: "Future Ballers (4–6)",
    group: "Programs",
    title:
      "Basketball for Kids Ages 4–6 in Dubai (Future Ballers) | Valencia Basket UAE",
    description:
      "Future Ballers is our entry-level basketball program for kids aged 4–6 in Dubai. Playful, movement-rich sessions at AllSports Arena, Al Quoz. Book a free trial today.",
    canonical: "/programs/future-ballers",
  },
  {
    path: "/programs/mini-basket",
    label: "Mini Basket (7–10)",
    group: "Programs",
    title:
      "Basketball for Kids Ages 7–10 in Dubai (Mini Basket) | Valencia Basket UAE",
    description:
      "Mini Basket is Valencia Basket UAE's structured basketball program for kids aged 7–10 in Dubai. Build real skills, teamwork, and a love for the game. Book a free trial.",
    canonical: "/programs/mini-basket",
  },
  {
    path: "/programs/youth-academy",
    label: "Youth Academy (11–18)",
    group: "Programs",
    title:
      "Basketball for Youth Ages 11–18 in Dubai (Youth Academy) | Valencia Basket UAE",
    description:
      "Youth Academy is Valencia Basket UAE's competitive development program for players aged 11–18 in Dubai. Tactics, conditioning, and competition pathways. Book a free trial.",
    canonical: "/programs/youth-academy",
  },
  {
    path: "/programs/girls-basketball",
    label: "Girls' Basketball Programs",
    group: "Programs",
    title: "Girls' Basketball Programs in Dubai | Basketball Training for Girls",
    description:
      "Girls' basketball academy in Dubai for ages 4-18. Build strength, confidence & real game skills with Spanish methodology & FIBA-certified coaches. Join today!",
    canonical: "/programs/girls-basketball",
  },
  {
    path: "/programs/private-training",
    label: "Private Training",
    group: "Programs",
    title: "Basketball Private Training Programs for Ages 4-18 | Valencia Basket UAE",
    description:
      "Accelerate your development with focused, personalised instruction from our expert staff. 1-on-1 and small group basketball training sessions. Join now!",
    canonical: "/programs/private-training",
  },
  {
    path: "/methodology",
    label: "Methodology",
    group: "Main",
    title: "Elite Spanish Basketball Coaching Methodology | Valencia Basket Academy UAE",
    description:
      "Check out the proven Valencia Basket methodology, a system built on strong values, tactical intelligence, and long-term player development. Learn more!",
    canonical: "/methodology",
  },
  {
    path: "/coaches",
    label: "Coaches",
    group: "Main",
    title: "Meet Our FIBA-Certified Basketball Coaches | Valencia Basket Academy UAE",
    description:
      "Meet the coaching staff and management team at Valencia Basket Academy UAE. FIBA-certified and Spanish-licensed coaches dedicated to player development!",
    canonical: "/coaches",
  },
  {
    path: "/facilities",
    label: "Facilities",
    group: "Main",
    title:
      "Basketball Training Location in Dubai - AllSports Arena | Valencia Basket UAE",
    description:
      "Train at AllSports Arena, Valencia Basket UAE's professional basketball training facility in Dubai. Join us today!",
    canonical: "/facilities",
  },
  {
    path: "/admissions",
    label: "Admissions",
    group: "Main",
    title: "Basketball Academy Admissions & Registration | Valencia Basket Academy UAE",
    description:
      "Join Valencia Basket Academy UAE. Learn about our admissions process, term dates, pricing, and frequently asked questions for parents. Join now!",
    canonical: "/admissions",
  },
  {
    path: "/events",
    label: "Events",
    group: "Events",
    title: "Basketball Camps & Events in Dubai | Valencia Basket UAE",
    description:
      "View our upcoming basketball camps, clinics & the exclusive Valencia training trip to Spain. Find opportunities to compete, learn & grow today!",
    canonical: "/events",
  },
  {
    path: "/blog",
    label: "Blog",
    group: "Main",
    title: "Basketball Academy Blog | Valencia Basket UAE",
    description:
      "Insights, academy stories, and basketball development guidance from Valencia Basket Academy UAE in Dubai.",
    canonical: "/blog",
  },
  {
    path: "/blog/author/maros-kovacik",
    label: "Author: Maros Kovacik",
    group: "Main",
    title: "Maros Kovacik, Director & Head Coach | Valencia Basket UAE",
    description:
      "Articles and bio from Maros Kovacik, Director & Head Coach of Valencia Basket Academy UAE, EuroLeague Coach of the Year (2013) and 15-time champion.",
    canonical: "/blog/author/maros-kovacik",
  },
  {
    path: "/blog/author/martin-pospisil",
    label: "Author: Martin Pospisil",
    group: "Main",
    title: "Martin Pospisil, Assistant Technical Director | Valencia Basket UAE",
    description:
      "Articles and bio from Martin Pospisil, Assistant Technical Director & Coach at Valencia Basket Academy UAE and head coach of the Slovak women's national team.",
    canonical: "/blog/author/martin-pospisil",
  },
  {
    path: "/contact",
    label: "Contact",
    group: "Main",
    title: "Contact Valencia Basket Academy UAE | Basketball in Dubai",
    description:
      "Get in touch with Valencia Basket Academy UAE. Contact us about programs, free trials, school partnerships and more. Based at AllSports Arena, Al Quoz, Dubai.",
    canonical: "/contact",
  },
  {
    path: "/faqs",
    label: "FAQs",
    group: "Main",
    title: "FAQs | Valencia Basket Academy UAE",
    description:
      "Frequently asked questions about Valencia Basket Academy UAE, covering programs, registration, fees, schedule, location, and more.",
    canonical: "/faqs",
  },
  {
    path: "/privacy-policy",
    label: "Privacy Policy",
    group: "Legal",
    title: "Privacy Policy | Valencia Basket Academy UAE",
    description:
      "Privacy Policy for Valencia Basket Academy UAE, explaining how we collect, use, and protect your personal data under the UAE Personal Data Protection Law and GDPR.",
    canonical: "/privacy-policy",
    ogDescription:
      "Privacy Policy for Valencia Basket Academy UAE, explaining how we collect, use, and protect your personal data.",
  },
  {
    path: "/terms",
    label: "Terms & Conditions",
    group: "Legal",
    title: "Terms and Conditions | Valencia Basket Academy UAE",
    description:
      "Terms and Conditions for Valencia Basket Academy UAE, covering registration, fees, refunds, code of conduct, and policies for all academy programs.",
    canonical: "/terms",
  },
  {
    path: "/thank-you",
    label: "Thank You",
    group: "Legal",
    title: "Thank You | Valencia Basket Academy UAE",
    description:
      "Thank you for getting in touch with Valencia Basket Academy UAE. Our team will be in contact with you shortly.",
    canonical: "/thank-you",
    // A post-submission confirmation page has no search value and should stay
    // out of the index, exactly as it did before.
    noIndex: true,
    noFollow: true,
  },
];

const BY_PATH = new Map(PAGE_SEO_DEFAULTS.map((page) => [page.path, page]));

export function getPageDefaults(path: string): PageSeoDefaults | undefined {
  return BY_PATH.get(path);
}

/**
 * Paths that must never be used as a redirect source: they are real pages,
 * API routes, or handled by next.config.ts.
 */
export const RESERVED_REDIRECT_SOURCES = new Set<string>([
  ...PAGE_SEO_DEFAULTS.map((p) => p.path),
  "/admin",
  "/thank-you",
  "/sitemap.xml",
  "/robots.txt",
  // already handled in next.config.ts
  "/book-trial",
  "/parents",
  "/teams",
]);

export const RESERVED_REDIRECT_PREFIXES = ["/api", "/_next", "/admin", "/images", "/events", "/teams"];
