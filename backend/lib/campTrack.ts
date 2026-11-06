/** Ad platforms and analytics: send an event if a tag is on the page; does nothing otherwise. */
export function trackCampEvent(event: "camp_enquiry" | "camp_whatsapp_click", camp: string) {
  const w = window as unknown as { dataLayer?: unknown[]; fbq?: (...a: unknown[]) => void; gtag?: (...a: unknown[]) => void };
  w.dataLayer?.push({ event, camp });
  w.fbq?.("track", event === "camp_enquiry" ? "Lead" : "Contact", { content_name: camp });
  w.gtag?.("event", event, { camp });
}
