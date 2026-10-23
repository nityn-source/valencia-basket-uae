import type { Reel } from "@/lib/reels";

/**
 * Sample reels, used ONLY on a local/dev site whose database has no reels yet,
 * so the layout can be previewed. They never show on the live site. Real reels
 * are added in Admin → Page Content → Instagram reels.
 */
export const SAMPLE_REELS: Reel[] = [
  { url: "https://www.instagram.com/reel/REPLACE_ME_HOME_1/", caption: "First session at the Arena", target: "homepage" },
  { url: "https://www.instagram.com/reel/REPLACE_ME_HOME_2/", caption: "Mini Basket drills", target: "homepage" },
  { url: "https://www.instagram.com/reel/REPLACE_ME_HOME_3/", caption: "Youth Academy game day", target: "homepage" },
  { url: "https://www.instagram.com/reel/REPLACE_ME_HOME_4/", caption: "Coaches from Valencia, in Dubai", target: "homepage" },
  { url: "https://www.instagram.com/reel/REPLACE_ME_HOME_5/", caption: "Training day highlights", target: "homepage" },
];
