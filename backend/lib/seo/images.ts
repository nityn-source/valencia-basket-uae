/**
 * Static content image placements.
 *
 * Renderers continue to use a placement key because it makes their intent
 * clear, but overrides are resolved by `src`: one file has one shared
 * description everywhere it appears.
 */

export interface ManagedImage {
  /** Stable placement key used by public renderers. */
  key: string;
  /** Page the image appears on (for the admin UI). */
  page: string;
  src: string;
  /** Code-defined fallback used when no file-level override is stored. */
  defaultAlt: string;
}

export interface ManagedImageAsset {
  /** The file path is the identity for a shared image description. */
  src: string;
  /** Stable storage key for the canonical, file-level database row. */
  storageKey: string;
  /** A single fallback description for the file, shared across placements. */
  defaultAlt: string;
  /** Every location where this file is rendered. */
  placements: ManagedImage[];
}

export const MANAGED_IMAGES: ManagedImage[] = [
  {
    key: "home.hero",
    page: "Home",
    src: "/images/hero-players-2.jpg",
    defaultAlt: "Valencia Basket UAE Action",
  },
  {
    key: "home.methodology",
    page: "Home",
    src: "/images/methodology.jpeg",
    defaultAlt: "Valencia Basket UAE trip to Spain",
  },
  {
    key: "home.arena",
    page: "Home",
    src: "/images/allsports-arena-render.jpg",
    defaultAlt: "AllSports Arena Al Quoz rendering",
  },
  {
    key: "home.future-ballers",
    page: "Home",
    src: "/images/mini-basket-team.jpg",
    defaultAlt: "Future Ballers (Kids)",
  },
  {
    key: "home.mini-basket",
    page: "Home",
    src: "/images/youth-team-small.jpg",
    defaultAlt: "Mini Basket",
  },
  {
    key: "home.youth-academy",
    page: "Home",
    src: "/images/youth-program.jpeg",
    defaultAlt: "Youth Academy",
  },
  {
    key: "home.elite",
    page: "Home",
    src: "/images/team-award.jpg",
    defaultAlt: "Elite / Select",
  },
  {
    key: "home.private-training",
    page: "Home",
    src: "/images/1v1-a.jpg",
    defaultAlt: "Private Training",
  },
  {
    key: "methodology.spain",
    page: "Methodology",
    src: "/images/methodology.jpeg",
    defaultAlt: "Valencia Basket UAE trip to Spain",
  },
  {
    key: "programs.private-training",
    page: "Programs",
    src: "/images/1v1-a.jpg",
    defaultAlt: "Private Training",
  },
  {
    key: "programs.future-ballers",
    page: "Programs",
    src: "/images/mini-basket-team.jpg",
    defaultAlt: "Future Ballers (Kids)",
  },
  {
    key: "programs.mini-basket",
    page: "Programs",
    src: "/images/youth-team-small.jpg",
    defaultAlt: "Mini Basket",
  },
  {
    key: "programs.youth-academy",
    page: "Programs",
    src: "/images/youth-program.jpeg",
    defaultAlt: "Youth Academy",
  },
  {
    key: "programs.girls",
    page: "Programs",
    src: "/images/girls-game.jpg",
    defaultAlt: "Girl driving to the basket in a girls' basketball league game in Dubai",
  },
  {
    key: "programs.elite",
    page: "Programs",
    src: "/images/team-award.jpg",
    defaultAlt: "Elite / Select",
  },
  {
    key: "private-training.session",
    page: "Private Training",
    src: "/images/1v1-a.jpg",
    defaultAlt: "Private Training Session",
  },
  {
    key: "future-ballers.hero",
    page: "Future Ballers",
    src: "/images/mini-basket-team.jpg",
    defaultAlt: "Future Ballers kids basketball Dubai",
  },
  {
    key: "future-ballers.session",
    page: "Future Ballers",
    src: "/images/mini-basket-team.jpg",
    defaultAlt: "Future Ballers session",
  },
  {
    key: "mini-basket.hero",
    page: "Mini Basket",
    src: "/images/youth-team-small.jpg",
    defaultAlt: "Mini Basket, basketball for kids ages 7 to 10, Dubai",
  },
  {
    key: "mini-basket.session",
    page: "Mini Basket",
    src: "/images/youth-team-small.jpg",
    defaultAlt: "Mini Basket session",
  },
  {
    key: "girls.intro",
    page: "Girls Programs",
    src: "/images/girls-game.jpg",
    defaultAlt: "Girl driving to the basket in a girls' basketball league game in Dubai",
  },
  {
    key: "youth-academy.hero",
    page: "Youth Academy",
    src: "/images/youth-program.jpeg",
    defaultAlt: "Youth Academy players training Dubai",
  },
  {
    key: "youth-academy.session",
    page: "Youth Academy",
    src: "/images/youth-program.jpeg",
    defaultAlt: "Youth Academy training session",
  },
  {
    key: "facilities.arena-render",
    page: "Facilities",
    src: "/images/allsports-arena-render.jpg",
    defaultAlt: "AllSports Arena facility overview render",
  },
  {
    key: "facilities.arena-courts",
    page: "Facilities",
    src: "/images/All-sports-arena.jpg",
    defaultAlt: "AllSports Arena multi-court indoor facility",
  },
  {
    key: "coaches.maros-kovacik",
    page: "Coaches",
    src: "/images/coach-maros.jpg",
    defaultAlt: "Coach Maros Kovacik",
  },
  {
    key: "coaches.martin-pospisil",
    page: "Coaches",
    src: "https://pub-b2680f6e721d4a92b41f30395b8feb3c.r2.dev/coach-martin-pospisil.webp",
    defaultAlt: "Coach Martin Pospisil",
  },
  {
    key: "coaches.saiid",
    page: "Coaches",
    src: "/images/coach_new/saiid.jpeg",
    defaultAlt: "Coach Saiid",
  },
  {
    key: "coaches.rabih",
    page: "Coaches",
    src: "/images/coach_new/rabih.jpeg",
    defaultAlt: "Rabih",
  },
  {
    key: "coaches.majil",
    page: "Coaches",
    src: "/images/coach_new/majil.jpeg",
    defaultAlt: "Coach Majil",
  },
  {
    key: "coaches.ahmed",
    page: "Coaches",
    src: "/images/coach_new/doksal.jpeg",
    defaultAlt: "Coach Ahmed",
  },
  {
    key: "coaches.guillem",
    page: "Coaches",
    src: "/images/coach-guillem.jpg",
    defaultAlt: "Coach Guillem",
  },
  {
    key: "coaches.andreu",
    page: "Coaches",
    src: "/images/coach-andreu.jpg",
    defaultAlt: "Coach Andreu",
  },
  {
    key: "coaches.ruben",
    page: "Coaches",
    src: "/images/coach-ruben.jpg",
    defaultAlt: "Coach Ruben",
  },
  {
    key: "coaches.carles",
    page: "Coaches",
    src: "/images/coach-carles.jpg",
    defaultAlt: "Coach Carles",
  },
  {
    key: "site.logo",
    page: "Site-wide",
    src: "/images/logo.png",
    defaultAlt: "Valencia Basket UAE Logo",
  },
  {
    key: "thank-you.logo",
    page: "Thank You",
    src: "/images/logo.png",
    defaultAlt: "Valencia Basket Academy",
  },
];

export const MANAGED_IMAGE_KEYS = new Set(MANAGED_IMAGES.map((image) => image.key));

const BY_KEY = new Map(MANAGED_IMAGES.map((image) => [image.key, image]));
const ASSETS_BY_SRC = new Map<string, ManagedImageAsset>();

for (const placement of MANAGED_IMAGES) {
  const existing = ASSETS_BY_SRC.get(placement.src);
  if (existing) {
    existing.placements.push(placement);
  } else {
    ASSETS_BY_SRC.set(placement.src, {
      src: placement.src,
      storageKey: `file:${placement.src}`,
      // The first placement is deliberately the canonical fallback. Admin
      // overrides replace it for every placement of this actual image file.
      defaultAlt: placement.defaultAlt,
      placements: [placement],
    });
  }
}

export const MANAGED_IMAGE_ASSETS = [...ASSETS_BY_SRC.values()];

export function getManagedImage(key: string): ManagedImage | undefined {
  return BY_KEY.get(key);
}

export function getManagedImageAsset(src: string): ManagedImageAsset | undefined {
  return ASSETS_BY_SRC.get(src);
}

export function getManagedImageAssetForKey(key: string): ManagedImageAsset | undefined {
  const placement = getManagedImage(key);
  return placement ? getManagedImageAsset(placement.src) : undefined;
}
