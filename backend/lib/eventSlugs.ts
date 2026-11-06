/**
 * Event pages whose address was shortened. The old address keeps working: a visit to it is redirected (301) to the new
 * one, so links in ads, search results and shared messages are not lost. Works in either order, before or after the
 * event's slug is changed in the admin.
 */
export const EVENT_SLUG_ALIASES: Readonly<Record<string, string>> = {
  "winter-camp-2026": "winter-camp",
};

/** The current slug for an old one, or undefined when the slug has not been renamed. */
export function renamedEventSlug(slug: string): string | undefined {
  return Object.prototype.hasOwnProperty.call(EVENT_SLUG_ALIASES, slug) ? EVENT_SLUG_ALIASES[slug] : undefined;
}
