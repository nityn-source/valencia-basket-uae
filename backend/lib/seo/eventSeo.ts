import type { PageSeoDefaults } from "./registry";

/** Exact SEO meta overrides per event slug (meta only — page content unaffected). */
export const EVENT_SEO: Record<string, { title: string; description: string }> = {
  "spring-break-camp": {
    title: "Basketball Spring Break Camp for Kids in Dubai (24th - 27th March 2026)",
    description:
      "A 4-day intensive basketball camp for kids during spring break. Perfect for players looking to sharpen their skills and stay active during the holidays. Join now!",
  },
  "valencia-trip": {
    title: "Basketball Trip to Valencia Basket Club, Spain (15th - 19th June, 2026)",
    description:
      "An exclusive 5-day basketball experience at the home of Valencia Basket. Train at L'Alqueria del Basket and experience the ROIG Arena. Join now!",
  },
  "winter-camp-2026": {
    title: "Basketball Winter Camp 2026 for Kids & Youth in Dubai (7th - 18th Dec)",
    description:
      "Two specialist basketball camps in Dubai this winter break: Skill Lab and Shooting Lab for ages 8-18, coached the Valencia way. From AED 1,000. Register now!",
  },
  "winter-camp": {
    title: "Basketball Winter Camp 2026 for Kids & Youth in Dubai (7th - 18th Dec)",
    description:
      "Two specialist basketball camps in Dubai this winter break: Skill Lab and Shooting Lab for ages 8-18, coached the Valencia way. From AED 1,000. Register now!",
  },
  "summer-camp": {
    title: "Basketball Summer Camp for Kids in Dubai (July - August 2026)",
    description:
      "Our flagship summer program returns with multiple weekly sessions throughout July and August. Age-appropriate training, competitions & fun activities. Join now!",
  },
};

/**
 * Code-defined metadata for an event detail page, before any database
 * override is applied. Events without a hand-written entry fall back to their
 * own title/description with the site suffix appended.
 */
export function eventPageDefaults(event: { slug: string; title: string; description: string }): PageSeoDefaults {
  const seo = EVENT_SEO[event.slug];
  return {
    path: `/events/${event.slug}`,
    label: event.title,
    group: "Events",
    title: seo ? seo.title : `${event.title} | Valencia Basket UAE`,
    description: seo?.description ?? event.description,
    canonical: `/events/${event.slug}`,
  };
}

export function eventRegisterPageDefaults(event: { slug: string; title: string }): PageSeoDefaults {
  return {
    path: `/events/${event.slug}/register`,
    label: `Register: ${event.title}`,
    group: "Events",
    title: `Register: ${event.title} | Valencia Basket UAE`,
    description: `Register for ${event.title} with Valencia Basket Academy UAE.`,
    canonical: `/events/${event.slug}/register`,
  };
}
