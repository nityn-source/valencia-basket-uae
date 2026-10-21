import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/adminAuth";
import { storage } from "@/lib/storage";
import { CONTENT_FIELDS, getContentField, getContentOverrides } from "@/lib/content/pageContent";

export const dynamic = "force-dynamic";

const PROGRAM_DETAIL_PAGES = [
  "/programs/future-ballers",
  "/programs/mini-basket",
  "/programs/youth-academy",
  "/programs/private-training",
];

const PAGE_PATHS: Record<string, string[]> = {
  Home: ["/"],
  Blog: ["/blog"],
  // Program photos and Home card blurbs live here too, so refresh everywhere they show.
  Programs: ["/", "/programs", ...PROGRAM_DETAIL_PAGES],
  Location: ["/facilities"],
  Staff: ["/coaches"],
  Contact: ["/contact"],
  Methodology: ["/methodology"],
  Admissions: ["/admissions"],
  "Events & Camps": ["/events"],
  "Future Ballers": ["/programs/future-ballers"],
  "Mini Basket": ["/programs/mini-basket"],
  "Youth Academy": ["/programs/youth-academy"],
  "Private Training": ["/programs/private-training"],
};


export async function GET(request: NextRequest) {
  const error = await requireAdmin(request);
  if (error) return error;

  const overrides = await getContentOverrides();
  // ?key=… returns that one field (used by the intro boxes in the Staff, Events and Blog tabs).
  const onlyKey = request.nextUrl.searchParams.get("key");
  const fields = onlyKey
    ? CONTENT_FIELDS.filter((field) => field.key === onlyKey)
    : CONTENT_FIELDS;
  const rows = fields.map((field) => {
    const row = overrides.get(field.key);
    return {
      key: field.key,
      page: field.page,
      section: field.section ?? null,
      label: field.label,
      type: field.type,
      maxLength: field.maxLength ?? null,
      default: field.default,
      value: row?.value ?? field.default,
      isOverridden: !!row,
      lastModified: row?.updatedAt?.toISOString() ?? null,
    };
  });

  return NextResponse.json(rows);
}

const body = z.object({
  key: z.string().min(1),
  // A string to set an override, or null to reset to the code default.
  value: z.string().max(5000).nullable(),
});

export async function PUT(request: NextRequest) {
  const error = await requireAdmin(request);
  if (error) return error;
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid content update" }, { status: 400 });

  const field = getContentField(parsed.data.key);
  if (!field) return NextResponse.json({ error: "Unknown content field" }, { status: 400 });

  if (parsed.data.value === null) {
    await storage.deletePageContentOverride(field.key);
  } else {
    const value = parsed.data.value.trim();
    if (!value) return NextResponse.json({ error: "Value cannot be empty" }, { status: 400 });
    if (field.maxLength && value.length > field.maxLength) {
      return NextResponse.json({ error: `Must be ${field.maxLength} characters or fewer` }, { status: 400 });
    }
    if (field.type === "image" && !/^https:\/\//i.test(value)) {
      return NextResponse.json({ error: "Image must be an HTTPS URL" }, { status: 400 });
    }
    await storage.upsertPageContentOverride(field.key, value);
  }

  for (const path of PAGE_PATHS[field.page] ?? []) revalidatePath(path);
  return NextResponse.json({ success: true });
}
