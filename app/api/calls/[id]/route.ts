import { NextResponse } from "next/server";
import { one } from "@/lib/db";

export const dynamic = "force-dynamic";

// The customer's screen polls this to know when the waiter acknowledged the call.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  const c = await one<{ status: string }>(
    "SELECT c.status FROM calls c JOIN restaurants r ON r.id = c.restaurant_id WHERE c.id = ? AND r.slug = ?",
    [Number(id), slug],
  );
  if (!c) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(c);
}
