import { one, run } from "../lib/db";
import { hashPassword } from "../lib/auth";

// Demo: http://localhost:3000/r/demo
// Demo accounts (local only - change them before publishing):
//   admin  : admin@menuqr.app  / Admin-Mesa-2026   -> edits the menu
//   mesero : mesero@menuqr.app / Mesero-Mesa-2026  -> receives table calls
// Photos in public/menu come from Wikimedia Commons (free licenses), see public/menu/CREDITS.md
type Dish = [name: string, description: string, price: number, photo: string, tags: string];

const STAFF = [
  { name: "Administrador", email: "admin@menuqr.app", password: "Admin-Mesa-2026", role: "admin" },
  { name: "Mesero", email: "mesero@menuqr.app", password: "Mesero-Mesa-2026", role: "mesero" },
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

async function main() {
  let rid = (await one<{ id: number }>("SELECT id FROM restaurants WHERE slug = 'demo'"))?.id;
  if (!rid) {
    const res = await run(
      "INSERT INTO restaurants (slug, name, description, currency, whatsapp, accent, tables_count, owner_email, password_hash) VALUES (?,?,?,?,?,?,?,?,?)",
      ["demo", "La Mesa de Ana", "Cocina colombiana para compartir.", "COP", "", "#1f5c46", 8, STAFF[0].email, await hashPassword(STAFF[0].password)],
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
    console.log("Restaurante demo creado: /r/demo");
  }
  for (const u of STAFF) {
    if (await one("SELECT id FROM staff WHERE email = ?", [u.email])) continue;
    await run("INSERT INTO staff (restaurant_id, name, email, password_hash, role) VALUES (?,?,?,?,?)", [
      rid, u.name, u.email, await hashPassword(u.password), u.role,
    ]);
    console.log(`Cuenta ${u.role}: ${u.email}`);
  }
}
main();
