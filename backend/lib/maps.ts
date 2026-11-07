/** A Google Maps search link for a venue name (opens the place in Maps, or the Maps app on a phone). */
export function mapsSearchUrl(place: string, city = "Dubai"): string {
  const words = `${place} ${city}`.replace(/[,]/g, " ").split(/\s+/).filter(Boolean);
  return `https://www.google.com/maps/search/?api=1&query=${words.map(encodeURIComponent).join("+")}`;
}
