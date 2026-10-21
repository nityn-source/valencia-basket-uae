import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { storage } from "@/lib/storage";
import { faqInputSchema } from "@/lib/content/faq";
import { rowToFaq } from "@/lib/content/faqStore";
import { revalidateFaqPages } from "@/lib/content/faqRevalidate";

export const dynamic = "force-dynamic";

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const error = await requireAdmin(request);
  if (error) return error;
  const id = parseId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid question id" }, { status: 400 });
  const existing = await storage.getFaqItemById(id);
  if (!existing) return NextResponse.json({ error: "Question not found" }, { status: 404 });

  const parsed = faqInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: issue?.message ?? "Invalid question", field: issue?.path[0] ?? null }, { status: 400 });
  }

  let sortOrder = existing.sortOrder;
  if (parsed.data.section !== existing.section) {
    const others = (await storage.getFaqItems()).filter((row) => row.section === parsed.data.section);
    sortOrder = Math.max(-1, ...others.map((row) => row.sortOrder)) + 1;
  }

  const updated = await storage.updateFaqItem(id, { ...parsed.data, sortOrder });
  revalidateFaqPages();
  return NextResponse.json(rowToFaq(updated!));
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const error = await requireAdmin(request);
  if (error) return error;
  const id = parseId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid question id" }, { status: 400 });
  if (!(await storage.getFaqItemById(id))) return NextResponse.json({ error: "Question not found" }, { status: 404 });
  await storage.deleteFaqItem(id);
  revalidateFaqPages();
  return NextResponse.json({ success: true });
}
