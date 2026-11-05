import { isPastEvent } from "@/lib/utils";

/** Registration is open unless switched off, past its closing date, or (with no closing date) past the event's end. */
export function isRegistrationOpen(event: {
  registrationOpen: boolean;
  registrationCloses: string | null;
  endDate: string | null;
}): boolean {
  if (!event.registrationOpen) return false;
  return !isPastEvent(event.registrationCloses || event.endDate);
}

/** Classcard link with website tags so camp sign-ups show up in Classcard/analytics reports. */
export function classcardLink(baseUrl: string, eventSlug: string, programmeId: string): string {
  try {
    const url = new URL(baseUrl);
    url.searchParams.set("utm_source", "website");
    url.searchParams.set("utm_medium", "event_page");
    url.searchParams.set("utm_campaign", eventSlug.replace(/-/g, "_"));
    url.searchParams.set("utm_content", programmeId.replace(/-/g, "_"));
    return url.toString();
  } catch {
    return baseUrl;
  }
}
