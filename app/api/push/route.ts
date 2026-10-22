import { NextResponse } from "next/server";
import { getRestaurant } from "@/lib/auth";
import { run } from "@/lib/db";
import { notifyStaff, pushEnabled } from "@/lib/push";

export const dynamic = "force-dynamic";

// GET  -> public key the browser needs to subscribe (null if push is not configured)
// POST -> save this device's subscription (staff only)
// PUT  -> send a test notification to the restaurant's phones (staff only)
// DELETE -> forget this device
export async function GET() {
  return NextResponse.json({ key: pushEnabled() ? process.env.VAPID_PUBLIC_KEY : null });
}

export async function POST(req: Request) {
  const r = await getRestaurant();
  if (!r) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sub = await req.json().catch(() => null);
  const endpoint = String(sub?.endpoint ?? "");
  const p256dh = String(sub?.keys?.p256dh ?? "");
  const auth = String(sub?.keys?.auth ?? "");
  if (!endpoint.startsWith("https://") || !p256dh || !auth) return NextResponse.json({ error: "bad subscription" }, { status: 400 });
  await run(
    "INSERT INTO push_subs (restaurant_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?) ON CONFLICT(endpoint) DO UPDATE SET restaurant_id = excluded.restaurant_id, p256dh = excluded.p256dh, auth = excluded.auth",
    [r.id, endpoint, p256dh, auth],
  );
  return NextResponse.json({ ok: true });
}

export async function PUT() {
  const r = await getRestaurant();
  if (!r) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const res = await notifyStaff(r.id, { title: "🔔 Aviso de prueba", body: "Así te avisaremos cuando una mesa llame.", tag: "test", url: "/admin" });
  return NextResponse.json(res);
}

export async function DELETE(req: Request) {
  const r = await getRestaurant();
  if (!r) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { endpoint } = (await req.json().catch(() => ({}))) as { endpoint?: string };
  if (endpoint) await run("DELETE FROM push_subs WHERE endpoint = ? AND restaurant_id = ?", [endpoint, r.id]);
  return NextResponse.json({ ok: true });
}
