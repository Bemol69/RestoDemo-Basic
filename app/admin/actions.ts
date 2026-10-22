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
// Each action returns null on success or a message to show the admin.

export async function saveCategory(f: FormData): Promise<string | null> {
  const r = await requireAdmin();
  const id = num(f, "id");
  const name = str(f, "name");
  if (!name) return "Escribe un nombre para la categoría.";
  if (id) await run("UPDATE categories SET name = ?, position = ? WHERE id = ? AND restaurant_id = ?", [name, num(f, "position"), id, r.id]);
  else await run("INSERT INTO categories (restaurant_id, name, position) VALUES (?, ?, ?)", [r.id, name, num(f, "position")]);
  revalidatePath("/admin/menu");
  revalidatePath("/r/[slug]", "page");
  return null;
}

export async function deleteCategory(f: FormData): Promise<string | null> {
  const r = await requireAdmin();
  await run("DELETE FROM items WHERE category_id = ? AND restaurant_id = ?", [num(f, "id"), r.id]);
  await run("DELETE FROM categories WHERE id = ? AND restaurant_id = ?", [num(f, "id"), r.id]);
  revalidatePath("/admin/menu");
  return null;
}

export async function saveItem(f: FormData): Promise<string | null> {
  const r = await requireAdmin();
  const id = num(f, "id");
  if (!str(f, "name")) return "El plato necesita un nombre.";
  if (!(await one("SELECT id FROM categories WHERE id = ? AND restaurant_id = ?", [num(f, "category_id"), r.id]))) return "Elige una categoría.";

  const current = id ? await one<{ image_url: string }>("SELECT image_url FROM items WHERE id = ? AND restaurant_id = ?", [id, r.id]) : undefined;
  let upload: string | null = null;
  try {
    upload = await savePhoto(f.get("image") as File | null, r.id);
  } catch (e) {
    return e instanceof Error ? e.message : "No se pudo subir la foto.";
  }
  const image = upload ?? current?.image_url ?? "";
  const tags = f.getAll("tags").map((t) => String(t).toLowerCase()).join(",");
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
  return null;
}

export async function deleteItem(f: FormData): Promise<string | null> {
  const r = await requireAdmin();
  await run("DELETE FROM items WHERE id = ? AND restaurant_id = ?", [num(f, "id"), r.id]);
  revalidatePath("/admin/menu");
  return null;
}

export async function saveSettings(f: FormData): Promise<string | null> {
  const r = await requireAdmin();
  await run("UPDATE restaurants SET name=?, description=?, tables_count=? WHERE id=?", [
    str(f, "name") || r.name,
    str(f, "description"),
    Math.min(Math.max(num(f, "tables_count"), 1), 200),
    r.id,
  ]);
  revalidatePath("/", "layout");
  return null;
}
