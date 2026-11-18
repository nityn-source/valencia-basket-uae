import { renamedEventSlug } from "@/lib/eventSlugs";

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

export const isCampLead = (booking: LeadPageFields) => Boolean(booking.sourcePage?.startsWith("camp-"));

const titleCase = (slug: string) => slug.split("-").filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");

/** The page a lead was filled in on, as a readable label: "Home", "Contact", or "Event: Winter Camp" for a camp page. */
export function leadPage(booking: { sourcePage?: string | null }): string {
  const page = booking.sourcePage?.trim();
  if (!page) return "";
  if (page === "home-quick") return "Home (quick form)";
  if (page === "programs-girls") return "Girls programs";
  if (page.startsWith("programs-")) return `${titleCase(page.slice("programs-".length))} program`;
  if (page.startsWith("camp-")) return `Event: ${titleCase(page.slice("camp-".length))}`;
  return titleCase(page);
}

/** The camp a camp-page lead chose (the camp form stores it in the programme field). Empty for other leads. */
export function leadCamp(booking: LeadPageFields): string {
  return isCampLead(booking) ? booking.programInterest?.trim() || "" : "";
}

/** Girl or Boy from a camp-page lead's notes ("Camp: Both Camps · Girl, age 12"); every lead from the girls programs page is a Girl. Empty for other leads. */
export function leadGender(booking: LeadPageFields): string {
  if (booking.sourcePage === "programs-girls") return "Girl";
  if (!isCampLead(booking)) return "";
  return booking.additionalInfo?.match(/·\s*(Girl|Boy)\b/)?.[1] ?? "";
}

/** The "Level" column is a skill level; camp leads keep their camp in the Camp column instead. */
export function leadLevel(booking: LeadPageFields): string {
  return isCampLead(booking) ? "" : booking.programInterest?.trim() || "";
}

/** The event slug a camp-page lead came from ("camp-winter-camp" -> "winter-camp"). Empty for other leads. */
export function leadEventSlug(booking: { sourcePage?: string | null }): string {
  const page = booking.sourcePage?.trim() ?? "";
  return page.startsWith("camp-") ? page.slice("camp-".length) : "";
}

/** The event name the camp form saved in the lead's notes ("... · Event: Basketball Winter Camp 2026"). Empty for older leads. */
export function leadNotedEvent(booking: { additionalInfo?: string | null }): string {
  return booking.additionalInfo?.match(/·\s*Event:\s*(.+)$/)?.[1]?.trim() ?? "";
}

/**
 * The event a camp-page lead belongs to, as the name to show. An exact match on the event's current address (an old,
 * renamed address is followed to the new one); failing that the name saved with the lead itself, so a later rename
 * or retitle never leaves it unlabelled; failing that the page label.
 */
export function eventTitleForLead(
  booking: { sourcePage?: string | null; additionalInfo?: string | null },
  events: { slug: string; title: string }[],
): string {
  const slug = leadEventSlug(booking);
  const current = renamedEventSlug(slug) ?? slug;
  return events.find((e) => e.slug === current)?.title ?? (leadNotedEvent(booking) || leadPage(booking).replace(/^Event: /, ""));
}

/** The notes a lead is saved with: the chosen program first ("Interested in: Mini Basket (ages 7–10)"), then anything the parent wrote. */
export function withInterest(interest: string, notes: string): string {
  const parts = [interest ? `Interested in: ${interest}` : "", notes.trim()].filter(Boolean);
  return parts.join(" · ");
}

/** The program a lead said they were interested in. Empty for older leads and for camp leads. */
export function leadInterest(booking: { additionalInfo?: string | null }): string {
  return booking.additionalInfo?.match(/^Interested in:\s*([^·]+?)\s*(?:·|$)/)?.[1]?.trim() ?? "";
}
