import { NextResponse } from "next/server";
import { getRestaurant } from "@/lib/auth";
import { query, run, type Call } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const r = await getRestaurant();
  if (!r) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  // Keep the table tiny (it is polled every few seconds): drop calls older than a day, now and then.
  if (Math.random() < 0.05) await run("DELETE FROM calls WHERE restaurant_id = ? AND created_at < datetime('now','-1 day')", [r.id]);
  const calls = await query<Call>(
    "SELECT * FROM calls WHERE restaurant_id = ? AND (status = 'pendiente' OR created_at > datetime('now','-2 hours')) ORDER BY id DESC LIMIT 60",
    [r.id],
  );
  return NextResponse.json({ name: r.name, calls });
}
