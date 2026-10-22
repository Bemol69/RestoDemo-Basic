import { NextResponse } from "next/server";
import { one, run } from "@/lib/db";

// Public: a customer presses "Llamar al mesero" and must say which table they are at.
const hits = new Map<string, number[]>();

function rateLimited(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > 5;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  if (rateLimited(ip)) return NextResponse.json({ error: "Ya avisaste varias veces, espera un momento." }, { status: 429 });

  const body = await req.json().catch(() => null);
  const table = String(body?.table ?? "").trim().slice(0, 20);
  if (!table) return NextResponse.json({ error: "Escribe el número de tu mesa." }, { status: 400 });
  const r = await one<{ id: number }>("SELECT id FROM restaurants WHERE slug = ?", [String(body?.slug ?? "")]);
  if (!r) return NextResponse.json({ error: "Restaurante no encontrado." }, { status: 404 });

  // One open call per table: pressing twice does not spam the waiter.
  const open = await one<{ id: number }>(
    "SELECT id FROM calls WHERE restaurant_id = ? AND table_label = ? AND status = 'pendiente'",
    [r.id, table],
  );
  if (open) return NextResponse.json({ ok: true, id: open.id });

  const res = await run("INSERT INTO calls (restaurant_id, table_label) VALUES (?, ?)", [r.id, table]);
  return NextResponse.json({ ok: true, id: Number(res.lastInsertRowid) });
}
