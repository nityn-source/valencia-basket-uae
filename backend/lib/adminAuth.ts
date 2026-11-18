import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  const token = request.cookies.get("admin_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const session = await storage.getSessionByToken(token);
  if (!session || new Date(session.expiresAt) < new Date()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/** The signed-in admin's username (for "saved by" in an article's version history), or null. */
export async function getAdminUsername(request: NextRequest): Promise<string | null> {
  try {
    const token = request.cookies.get("admin_token")?.value;
    if (!token) return null;
    const session = await storage.getSessionByToken(token);
    if (!session) return null;
    const user = (await storage.getAllAdminUsers()).find((candidate) => candidate.id === session.userId);
    return user?.username ?? null;
  } catch {
    return null;
  }
}
