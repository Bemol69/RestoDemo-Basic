"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { one, run } from "@/lib/db";
import { checkPassword, endSession, requireAdmin, requireRestaurant, startSession, type Role } from "@/lib/auth";
import { savePhoto } from "@/lib/media";
import { toCents } from "@/lib/money";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const num = (f: FormData, k: string) => Number(f.get(k) ?? 0) || 0;

/* ---------- Session ---------- */

export async function login(_: string | null, f: FormData): Promise<string | null> {
  const u = await one<{ restaurant_id: number; password_hash: string; role: Role }>(
    "SELECT restaurant_id, password_hash, role FROM staff WHERE email = ?",
    [str(f, "email").toLowerCase()],
  );
  if (!u || !(await checkPassword(String(f.get("password") ?? ""), u.password_hash))) return "Email o contraseña incorrectos.";
  await startSession(u.restaurant_id, u.role);
  redirect(u.role === "admin" ? "/admin/menu" : "/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

/* ---------- Calls (mesero + admin) ---------- */

export async function answerCall(id: number) {
  const r = await requireRestaurant();
  await run(
    "UPDATE calls SET status = 'atendido', answered_at = datetime('now') WHERE id = ? AND restaurant_id = ? AND status = 'pendiente'",
    [id, r.id],
  );
}

/* ---------- Menu (admin only) ---------- */

export async function saveCategory(f: FormData) {
  const r = await requireAdmin();
  const id = num(f, "id");
  const name = str(f, "name");
  if (!name) return;
  if (id) await run("UPDATE categories SET name = ?, position = ? WHERE id = ? AND restaurant_id = ?", [name, num(f, "position"), id, r.id]);
  else await run("INSERT INTO categories (restaurant_id, name, position) VALUES (?, ?, ?)", [r.id, name, num(f, "position")]);
  revalidatePath("/admin/menu");
}

export async function deleteCategory(f: FormData) {
  const r = await requireAdmin();
  await run("DELETE FROM items WHERE category_id = ? AND restaurant_id = ?", [num(f, "id"), r.id]);
  await run("DELETE FROM categories WHERE id = ? AND restaurant_id = ?", [num(f, "id"), r.id]);
  revalidatePath("/admin/menu");
}

export async function saveItem(f: FormData) {
  const r = await requireAdmin();
  const id = num(f, "id");
  if (!str(f, "name") || !(await one("SELECT id FROM categories WHERE id = ? AND restaurant_id = ?", [num(f, "category_id"), r.id]))) return;

  const current = id ? await one<{ image_url: string }>("SELECT image_url FROM items WHERE id = ? AND restaurant_id = ?", [id, r.id]) : undefined;
  const image = (await savePhoto(f.get("image") as File | null, r.id)) ?? (str(f, "image_url") || current?.image_url || "");
  const tags = str(f, "tags").split(",").map((t) => t.trim().toLowerCase()).filter(Boolean).join(",");
  const vals = [num(f, "category_id"), str(f, "name"), str(f, "description"), toCents(str(f, "price")), image, tags, f.get("available") ? 1 : 0];

  if (id) {
    await run(
      "UPDATE items SET category_id=?, name=?, description=?, price_cents=?, image_url=?, tags=?, available=? WHERE id=? AND restaurant_id=?",
      [...vals, id, r.id],
    );
  } else {
    await run(
      "INSERT INTO items (category_id, name, description, price_cents, image_url, tags, available, restaurant_id) VALUES (?,?,?,?,?,?,?,?)",
      [...vals, r.id],
    );
  }
  revalidatePath("/admin/menu");
}

export async function deleteItem(f: FormData) {
  const r = await requireAdmin();
  await run("DELETE FROM items WHERE id = ? AND restaurant_id = ?", [num(f, "id"), r.id]);
  revalidatePath("/admin/menu");
}

export async function toggleAvailable(f: FormData) {
  const r = await requireAdmin();
  await run("UPDATE items SET available = 1 - available WHERE id = ? AND restaurant_id = ?", [num(f, "id"), r.id]);
  revalidatePath("/admin/menu");
}

export async function saveSettings(f: FormData) {
  const r = await requireAdmin();
  const accent = /^#[0-9a-fA-F]{6}$/.test(str(f, "accent")) ? str(f, "accent") : r.accent;
  await run("UPDATE restaurants SET name=?, description=?, currency=?, accent=?, tables_count=? WHERE id=?", [
    str(f, "name") || r.name,
    str(f, "description"),
    str(f, "currency").toUpperCase().slice(0, 3) || r.currency,
    accent,
    Math.min(Math.max(num(f, "tables_count"), 1), 200),
    r.id,
  ]);
  revalidatePath("/", "layout");
}
