/** The source shown for a lead that came from an event or camp page, which has no "how did you hear" answer. */
export const EVENT_PAGE_SOURCE = "Event page";

/**
 * Where a lead says it came from. Forms ask "how did you hear about us"; the short camp form doesn't, so those leads
 * (saved with a source page like "camp-winter-camp-2026") count as coming from the event page. Empty when unknown.
 */
export function leadSource(booking: { howHeard?: string | null; sourcePage?: string | null }): string {
  if (booking.howHeard) return booking.howHeard;
  return booking.sourcePage?.startsWith("camp-") ? EVENT_PAGE_SOURCE : "";
}

type LeadPageFields = { sourcePage?: string | null; programInterest?: string | null; additionalInfo?: string | null };

const isCampLead = (booking: LeadPageFields) => Boolean(booking.sourcePage?.startsWith("camp-"));

/** The page a lead was filled in on, as a readable label: "Home", "Contact", or "Event: Winter Camp" for a camp page. */
export function leadPage(booking: { sourcePage?: string | null }): string {
  const page = booking.sourcePage?.trim();
  if (!page) return "";
  if (page.startsWith("camp-")) {
    const words = page.slice("camp-".length).split("-").filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1));
    return `Event: ${words.join(" ")}`;
  }
  return page[0].toUpperCase() + page.slice(1);
}

/** The camp a camp-page lead chose (the camp form stores it in the programme field). Empty for other leads. */
export function leadCamp(booking: LeadPageFields): string {
  return isCampLead(booking) ? booking.programInterest?.trim() || "" : "";
}

/** Girl or Boy from a camp-page lead's notes ("Camp: Both Camps · Girl, age 12"). Empty for other leads. */
export function leadGender(booking: LeadPageFields): string {
  if (!isCampLead(booking)) return "";
  return booking.additionalInfo?.match(/·\s*(Girl|Boy)\b/)?.[1] ?? "";
}

/** The "Level" column is a skill level; camp leads keep their camp in the Camp column instead. */
export function leadLevel(booking: LeadPageFields): string {
  return isCampLead(booking) ? "" : booking.programInterest?.trim() || "";
}
