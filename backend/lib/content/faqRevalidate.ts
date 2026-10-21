import "server-only";
import { revalidatePath } from "next/cache";

/** The FAQ page (its FAQPage schema is rendered with it). */
export function revalidateFaqPages() {
  revalidatePath("/faqs");
}
