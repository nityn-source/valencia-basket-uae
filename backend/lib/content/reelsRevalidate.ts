import "server-only";
import { revalidatePath } from "next/cache";

/** Pages that can show reels: the homepage and the four program pages. */
export function revalidateReelPages() {
  revalidatePath("/");
  for (const slug of ["future-ballers", "mini-basket", "youth-academy", "private-training"]) {
    revalidatePath(`/programs/${slug}`);
  }
}
