import type { CampDetails } from "@shared/campDetails";

/**
 * The small tags on an event card for a camp: each camp's name, then the ages ("Skill Lab", "Shooting Lab",
 * "Ages 8–18"), read from the camp page so they stay in step with it.
 */
export function campCardTags(details: CampDetails | null | undefined, max = 4): string[] {
  if (!details) return [];
  const names = details.programmes.filter((programme) => programme.weekLabel || programme.timeLines.length > 0).map((programme) => programme.name.trim()).filter(Boolean);
  const range = details.openFor.match(/(\d{1,2})\s*[-–]\s*(\d{1,2})/);
  const ages = range ? [`Ages ${range[1]}–${range[2]}`] : [];
  return [...names, ...ages].slice(0, max);
}
