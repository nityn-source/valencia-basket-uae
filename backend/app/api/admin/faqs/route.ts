import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { storage } from "@/lib/storage";
import { faqInputSchema, slugifyQuestion, sortFaqs } from "@/lib/content/faq";
import { rowToFaq, seedFaqsIfEmpty } from "@/lib/content/faqStore";
import { revalidateFaqPages } from "@/lib/content/faqRevalidate";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const error = await requireAdmin(request);
  if (error) return error;

  // First visit fills the table with today's questions, so edits have rows to change.
  await seedFaqsIfEmpty();
  const rows = await storage.getFaqItems();
  return NextResponse.json({ items: sortFaqs(rows.map(rowToFaq)) });
}

export async function POST(request: NextRequest) {
  const error = await requireAdmin(request);
  if (error) return error;
  const parsed = faqInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: issue?.message ?? "Invalid question", field: issue?.path[0] ?? null }, { status: 400 });
  }

  await seedFaqsIfEmpty();
  const existing = await storage.getFaqItems();
  const taken = new Set(existing.map((row) => row.slug));
  const base = slugifyQuestion(parsed.data.question);
  let slug = base;
  for (let suffix = 2; taken.has(slug); suffix += 1) slug = `${base}-${suffix}`;
  const lastInSection = Math.max(-1, ...existing.filter((row) => row.section === parsed.data.section).map((row) => row.sortOrder));

  const created = await storage.createFaqItem({ ...parsed.data, slug, sortOrder: lastInSection + 1 });
  revalidateFaqPages();
  return NextResponse.json(rowToFaq(created), { status: 201 });
}
