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

/** Where an event sign-up came from: the ad or link source when it carries one, otherwise the event page itself. */
export function registrationSource(registration: { utmSource?: string | null }): string {
  const utm = registration.utmSource?.trim();
  return utm && utm !== "direct" ? utm : EVENT_PAGE_SOURCE;
}
