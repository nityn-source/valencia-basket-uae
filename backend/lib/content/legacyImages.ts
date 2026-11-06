/**
 * The original site's photos, restored to public/images/ so they are served at
 * their pre-migration addresses (valenciabasket.ae/images/<name>, and the
 * matching /_next/image?url=/images/<name> resized versions). Google indexed
 * and ranked these URLs, so they must not change. Byte-identical to the
 * copies in R2. Photos uploaded later through the admin live in R2 instead.
 *
 * Used by next.config.ts (only other /images paths redirect to R2) and by
 * code that decides whether an /images path is a local file.
 */
export const LEGACY_IMAGES: readonly string[] = [
  "1v1-a.jpg",
  "All-sports-arena.jpg",
  "SPAIN-COURT.jpg",
  "allsports-arena-render.jpg",
  "coach-andreu.jpg",
  "coach-carles.jpg",
  "coach-guillem.jpg",
  "coach-maros.jpg",
  "coach-ruben.jpg",
  "coach_new/brian.jpeg",
  "coach_new/doksal.jpeg",
  "coach_new/majil.jpeg",
  "coach_new/nour.jpeg",
  "coach_new/rabih.jpeg",
  "coach_new/saiid.jpeg",
  "dubai-heights-academy.jpeg",
  "english-college.jpg",
  "girls-game.jpg",
  "girls-practice.jpg",
  "hero-players-2.jpg",
  "logo.png",
  "methodology.jpeg",
  "mini-basket-team.jpg",
  "roig-arena.jpeg",
  "spain-camp.jpg",
  "summer-camp-1.jpg",
  "summer-camp.jpg",
  "team-award.jpg",
  "team-court-photo.jpg",
  "team-huddle-coaches.jpg",
  "team-spirit.jpg",
  "tournament-team.jpg",
  "youth-program.jpeg",
  "youth-team-small.jpg",
  // Not an original: added later and committed here (rather than uploaded to R2) so it is served at /images/<name>.
  "winter-camp-coaching.jpg",
];

const legacy = new Set(LEGACY_IMAGES);

/** True for "/images/<name>" when <name> is one of the restored original photos. */
export function isLegacyImagePath(path: string): boolean {
  return path.startsWith("/images/") && legacy.has(path.slice("/images/".length));
}
