import "server-only";
import { cache } from "react";
import { storage } from "@/lib/storage";
import { EXTRA_FIELDS } from "./pageContentFields";

export type ContentFieldType = "text" | "textarea" | "image";

export interface ContentField {
  key: string;
  page: string;
  /** Optional sub-heading inside the page group in Admin → Page Content. */
  section?: string;
  label: string;
  type: ContentFieldType;
  maxLength?: number;
  default: string;
}

const BASE_FIELDS: ContentField[] = [
  // ---- Home ----

  // ---- Programs: one block per program (photo, Programs page text, Home card blurb) ----

  // ---- Facilities ----

  // ---- Admissions ----

  // ---- Events ----

  // ---- Program: Future Ballers ----

  // ---- Program: Mini Basket ----

  // ---- Program: Youth Academy ----

  // ---- Program: Private Training ----

  // ---- Blog (listing page only — individual posts are managed in the Blog tab) ----

  // ---- Staff (Coaches page) ----

];

/** Hand-written fields above, plus the per-page text fields in pageContentFields.ts. */
export const CONTENT_FIELDS: ContentField[] = [...BASE_FIELDS, ...EXTRA_FIELDS];

const fieldMap = new Map(CONTENT_FIELDS.map((field) => [field.key, field]));

export function getContentField(key: string): ContentField | undefined {
  return fieldMap.get(key);
}

export const getContentOverrides = cache(async () => {
  try {
    return new Map((await storage.getAllPageContentOverrides()).map((row) => [row.key, row]));
  } catch (error) {
    console.error("[content] failed to load page content overrides:", error);
    return new Map();
  }
});

/**
 * Loads the saved overrides once and returns a lookup for a page's text, so a
 * page with dozens of fields does one read. Same fallback as getContent.
 */
export async function getContentGetter(): Promise<(key: string) => string> {
  const overrides = await getContentOverrides();
  return (key) => {
    const field = fieldMap.get(key);
    if (!field) throw new Error(`Unknown content field: ${key}`);
    return overrides.get(key)?.value ?? field.default;
  };
}

/** Every text field whose key starts with `prefix`, for handing a page's text to a client component. */
export async function getContentGroup(prefix: string): Promise<Record<string, string>> {
  const get = await getContentGetter();
  return Object.fromEntries(CONTENT_FIELDS.filter((field) => field.key.startsWith(prefix)).map((field) => [field.key, get(field.key)]));
}

export async function getContent(key: string): Promise<string> {
  const field = fieldMap.get(key);
  if (!field) throw new Error(`Unknown content field: ${key}`);
  const overrides = await getContentOverrides();
  return overrides.get(key)?.value ?? field.default;
}
