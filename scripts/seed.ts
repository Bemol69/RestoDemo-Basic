import { one, run } from "../lib/db";
import { hashPassword } from "../lib/auth";

// Demo: http://localhost:3000/r/demo  ·  waiter login: mesero@menuqr.app / mesero12345
// Photos in public/menu come from Wikimedia Commons (free licenses), see public/menu/CREDITS.md
type Dish = [name: string, description: string, price: number, photo: string, tags: string];

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
  if (await one("SELECT id FROM restaurants WHERE slug = 'demo'")) {
    console.log("Demo ya existe (borra local.db para recrearlo).");
    return;
  }
  const res = await run(
    "INSERT INTO restaurants (slug, name, description, currency, whatsapp, accent, tables_count, owner_email, password_hash) VALUES (?,?,?,?,?,?,?,?,?)",
    ["demo", "La Mesa de Ana", "Cocina colombiana para compartir.", "COP", "", "#1f5c46", 8, "mesero@menuqr.app", await hashPassword("mesero12345")],
  );
  const rid = Number(res.lastInsertRowid);
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
  console.log("Demo creado: /r/demo  ·  mesero@menuqr.app / mesero12345");
}
main();
