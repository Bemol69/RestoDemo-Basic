import type { InValue, ResultSet } from "@libsql/client";
import { hashPassword } from "./auth";

// Talks to the database directly (not through db.ts helpers, which wait for this seed to finish).
export type Exec = (sql: string, args?: InValue[]) => Promise<ResultSet>;

// First-run data: the demo restaurant and the two staff accounts.
// Photos in public/menu come from Wikimedia Commons (free licenses), see public/menu/CREDITS.md
//
// Accounts: set ADMIN_EMAIL / ADMIN_PASSWORD and MESERO_EMAIL / MESERO_PASSWORD in the environment.
// In development, if they are missing, local demo accounts are used. In production nothing is
// created without them, so a public site never ships with well-known passwords.
type Dish = [name: string, description: string, price: number, photo: string, tags: string];

const dev = process.env.NODE_ENV !== "production";
const STAFF = [
  { name: "Administrador", role: "admin", email: process.env.ADMIN_EMAIL || (dev ? "admin@menuqr.app" : ""), password: process.env.ADMIN_PASSWORD || (dev ? "Admin-Mesa-2026" : "") },
  { name: "Mesero", role: "mesero", email: process.env.MESERO_EMAIL || (dev ? "mesero@menuqr.app" : ""), password: process.env.MESERO_PASSWORD || (dev ? "Mesero-Mesa-2026" : "") },
];

const MENU: Record<string, Dish[]> = {
  "Platos fuertes": [
    ["Bandeja paisa", "Frijoles, arroz, chicharrón, chorizo, huevo frito, plátano maduro, arepa y aguacate.", 42000, "bandeja-paisa", ""],
    ["Ajiaco santafereño", "Sopa bogotana de tres papas con pollo, mazorca, alcaparras y aguacate.", 36000, "ajiaco", "sin gluten"],
    ["Pollo con patacón", "Pollo guisado con arroz, ensalada y patacón crocante.", 34000, "patacon", ""],
  ],
  Entradas: [
    ["Empanadas colombianas", "Dos empanadas de maíz crocantes con ají casero.", 14000, "empanadas", ""],
    ["Arepa rellena de huevo", "Arepa frita rellena de huevo pericos.", 12000, "arepa-queso", "vegetariano"],
  ],
  Bebidas: [
    ["Limonada de coco", "Cremosa, con coco rallado.", 12000, "limonada", "vegano"],
    ["Jugo de lulo", "Natural, en agua o en leche.", 9000, "lulo", "vegano"],
  ],
  Postres: [["Torta tres leches", "Bizcocho bañado en tres leches con crema y chocolate.", 15000, "tres-leches", "vegetariano"]],
};

export async function ensureSeed(exec: Exec) {
  const run = exec;
  const one = async (sql: string, args: InValue[] = []) => (await exec(sql, args)).rows[0] as Record<string, unknown> | undefined;
  let rid = (await one("SELECT id FROM restaurants ORDER BY id LIMIT 1"))?.id as number | undefined;
  if (!rid) {
    const res = await run(
      "INSERT INTO restaurants (slug, name, description, currency, whatsapp, accent, tables_count, owner_email, password_hash) VALUES (?,?,?,?,?,?,?,?,?)",
      ["demo", "Restaurant Demo", "Cocina colombiana para compartir.", "COP", "", "#7b1e2b", 8, "owner@restaurant-demo.local", "-"],
    );
    rid = Number(res.lastInsertRowid);
    let pos = 0;
    for (const [cat, dishes] of Object.entries(MENU)) {
      const c = await run("INSERT INTO categories (restaurant_id, name, position) VALUES (?,?,?)", [rid, cat, pos++]);
      for (const [name, desc, price, photo, tags] of dishes) {
        await run(
          "INSERT INTO items (restaurant_id, category_id, name, description, price_cents, image_url, tags) VALUES (?,?,?,?,?,?,?)",
          [rid, Number(c.lastInsertRowid), name, desc, price * 100, `/menu/${photo}.jpg`, tags],
        );
      }
    }
  }
  for (const u of STAFF) {
    if (!u.email || !u.password) continue;
    if (await one("SELECT id FROM staff WHERE email = ?", [u.email.toLowerCase()])) continue;
    await run("INSERT INTO staff (restaurant_id, name, email, password_hash, role) VALUES (?,?,?,?,?)", [
      rid, u.name, u.email.toLowerCase(), await hashPassword(u.password), u.role,
    ]);
  }
}
