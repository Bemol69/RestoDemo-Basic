"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { one, query, run } from "@/lib/db";
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

/* ---------- Menu editor (admin only): one "Guardar todo" ---------- */
// The editor is a single form. Field names:
//   s.name | s.description | s.tables_count        restaurant data
//   c.<id>.name | c.<id>.delete                     existing categories
//   i.<id>.<field> | i.<id>.present | i.<id>.delete existing dishes
//   new.<categoryId>.<field>                        a new dish (ignored if the name is empty)
//   newcat.name                                     a new category (ignored if empty)
// Returns null on success or a message to show the admin.

export async function saveAll(f: FormData): Promise<string | null> {
  const r = await requireAdmin();

  // Restaurant data
  if (f.has("s.name")) {
    await run("UPDATE restaurants SET name=?, description=?, tables_count=? WHERE id=?", [
      str(f, "s.name") || r.name,
      str(f, "s.description"),
      Math.min(Math.max(num(f, "s.tables_count"), 1), 200),
      r.id,
    ]);
  }

  // Categories: rename or delete (a deleted category takes its dishes with it)
  const cats = await query<{ id: number }>("SELECT id FROM categories WHERE restaurant_id = ?", [r.id]);
  const liveCats = new Set<number>();
  for (const c of cats) {
    if (f.get(`c.${c.id}.delete`)) {
      await run("DELETE FROM items WHERE category_id = ? AND restaurant_id = ?", [c.id, r.id]);
      await run("DELETE FROM categories WHERE id = ? AND restaurant_id = ?", [c.id, r.id]);
      continue;
    }
    liveCats.add(c.id);
    if (str(f, `c.${c.id}.name`)) {
      await run("UPDATE categories SET name = ? WHERE id = ? AND restaurant_id = ?", [str(f, `c.${c.id}.name`), c.id, r.id]);
    }
  }
  const newCat = str(f, "newcat.name");
  if (newCat) {
    await run("INSERT INTO categories (restaurant_id, name, position) VALUES (?, ?, ?)", [r.id, newCat, cats.length]);
  }

  // Existing dishes
  const items = await query<{ id: number; image_url: string; category_id: number }>(
    "SELECT id, image_url, category_id FROM items WHERE restaurant_id = ?",
    [r.id],
  );
  for (const it of items) {
    const p = `i.${it.id}`;
    if (!f.has(`${p}.present`)) continue;
    if (f.get(`${p}.delete`)) {
      await run("DELETE FROM items WHERE id = ? AND restaurant_id = ?", [it.id, r.id]);
      continue;
    }
    const name = str(f, `${p}.name`);
    if (!name) return "Hay un plato sin nombre. Escríbelo antes de guardar.";
    let photo: string | null = null;
    try {
      photo = await savePhoto(f.get(`${p}.image`) as File | null, r.id);
    } catch (e) {
      return `Foto de "${name}": ${e instanceof Error ? e.message : "no se pudo subir."}`;
    }
    const cat = num(f, `${p}.category_id`);
    await run(
      "UPDATE items SET category_id=?, name=?, description=?, price_cents=?, image_url=?, tags=?, available=? WHERE id=? AND restaurant_id=?",
      [
        liveCats.has(cat) ? cat : it.category_id,
        name,
        str(f, `${p}.description`),
        toCents(str(f, `${p}.price`)),
        photo ?? it.image_url,
        f.getAll(`${p}.tags`).map((t) => String(t).toLowerCase()).join(","),
        f.get(`${p}.available`) ? 1 : 0,
        it.id,
        r.id,
      ],
    );
  }

  // New dishes (one blank card per category)
  for (const cat of liveCats) {
    const p = `new.${cat}`;
    const name = str(f, `${p}.name`);
    if (!name) continue;
    let photo: string | null = null;
    try {
      photo = await savePhoto(f.get(`${p}.image`) as File | null, r.id);
    } catch (e) {
      return `Foto de "${name}": ${e instanceof Error ? e.message : "no se pudo subir."}`;
    }
    await run(
      "INSERT INTO items (restaurant_id, category_id, name, description, price_cents, image_url, tags, available) VALUES (?,?,?,?,?,?,?,?)",
      [r.id, cat, name, str(f, `${p}.description`), toCents(str(f, `${p}.price`)), photo ?? "", f.getAll(`${p}.tags`).map((t) => String(t).toLowerCase()).join(","), f.get(`${p}.available`) ? 1 : 0],
    );
  }

  revalidatePath("/", "layout");
  return null;
}
