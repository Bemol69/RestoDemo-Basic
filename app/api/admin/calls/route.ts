import { NextResponse } from "next/server";
import { getRestaurant } from "@/lib/auth";
import { query, type Call } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const r = await getRestaurant();
  if (!r) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const calls = await query<Call>(
    "SELECT * FROM calls WHERE restaurant_id = ? AND (status = 'pendiente' OR created_at > datetime('now','-2 hours')) ORDER BY id DESC LIMIT 60",
    [r.id],
  );
  return NextResponse.json({ name: r.name, calls });
}
