import "server-only";
import { cache } from "react";
import { storage } from "@/lib/storage";
import type { FaqItemRow, InsertFaqItemRow } from "@shared/schema";
import { DEFAULT_FAQS, FAQ_SECTION_IDS, sortFaqs, type FaqItem, type FaqSectionId } from "@/lib/content/faq";

export function rowToFaq(row: FaqItemRow): FaqItem {
  return {
    id: row.id,
    slug: row.slug,
    section: (FAQ_SECTION_IDS as readonly string[]).includes(row.section) ? (row.section as FaqSectionId) : "about",
    question: row.question,
    answer: row.answer,
    sortOrder: row.sortOrder,
    visible: row.visible,
  };
}

/**
 * Every question, hidden included, in display order. Until Admin → FAQs has
 * been opened once (which fills the table), or if the database is
 * unreachable, this is the built-in default list so the FAQ page never breaks.
 */
export const getAllFaqs = cache(async (): Promise<FaqItem[]> => {
  try {
    const rows = await storage.getFaqItems();
    if (rows.length) return sortFaqs(rows.map(rowToFaq));
  } catch (error) {
    console.error("[faq] failed to load FAQs, using defaults:", error);
  }
  return sortFaqs(DEFAULT_FAQS);
});

export async function getVisibleFaqs() {
  return (await getAllFaqs()).filter((item) => item.visible);
}

/** Fills an empty FAQ table with the defaults (idempotent). */
export async function seedFaqsIfEmpty() {
  if ((await storage.getFaqItems()).length) return;
  const rows: InsertFaqItemRow[] = DEFAULT_FAQS.map((item) => ({
    slug: item.slug,
    section: item.section,
    question: item.question,
    answer: item.answer,
    sortOrder: item.sortOrder,
    visible: item.visible,
  }));
  await storage.seedFaqItems(rows);
}
