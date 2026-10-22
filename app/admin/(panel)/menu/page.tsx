import { requireAdmin } from "@/lib/auth";
import { query, type Category, type Item } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { deleteCategory, deleteItem, saveCategory, saveItem, saveSettings, toggleAvailable } from "../../actions";

export const dynamic = "force-dynamic";

function ItemForm({ item, categories, catId }: { item?: Item; categories: Category[]; catId?: number }) {
  return (
    <form action={saveItem}>
      {item && <input type="hidden" name="id" value={item.id} />}
      <div className="row">
        <label>Nombre<input name="name" defaultValue={item?.name} required maxLength={80} /></label>
        <label>Precio<input name="price" type="number" step="0.01" min="0" defaultValue={item ? item.price_cents / 100 : ""} required /></label>
        <label>
          Categoría
          <select name="category_id" defaultValue={item?.category_id ?? catId}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      </div>
      <label>Descripción<textarea name="description" defaultValue={item?.description} rows={2} maxLength={300} /></label>
      <label>Etiquetas (separadas por coma)<input name="tags" defaultValue={item?.tags} placeholder="vegano, sin gluten, picante" /></label>
      <div className="row">
        <label>Foto nueva (JPG/PNG/WebP, máx 8 MB)<input type="file" name="image" accept="image/*" /></label>
        <label>…o URL de la foto<input name="image_url" defaultValue={item?.image_url} placeholder="/menu/plato.jpg o https://…" /></label>
      </div>
      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="checkbox" name="available" defaultChecked={item ? !!item.available : true} style={{ width: "auto" }} /> Disponible
      </label>
      <button>{item ? "Guardar cambios" : "Agregar plato"}</button>
    </form>
  );
}

export default async function MenuAdmin() {
  const r = await requireAdmin();
  const categories = await query<Category>("SELECT * FROM categories WHERE restaurant_id = ? ORDER BY position, id", [r.id]);
  const items = await query<Item>("SELECT * FROM items WHERE restaurant_id = ? ORDER BY position, id", [r.id]);

  return (
    <>
      <h1>Editar carta</h1>

      <details className="panel">
        <summary>Datos del restaurante</summary>
        <form action={saveSettings} style={{ paddingTop: 12 }}>
          <label>Nombre<input name="name" defaultValue={r.name} required /></label>
          <label>Descripción corta<textarea name="description" defaultValue={r.description} rows={2} maxLength={200} /></label>
          <div className="row">
            <label>Moneda (3 letras)<input name="currency" defaultValue={r.currency} maxLength={3} /></label>
            <label>Color de marca<input name="accent" type="color" defaultValue={r.accent} style={{ height: 42, padding: 2 }} /></label>
            <label>Mesas<input name="tables_count" type="number" min="1" max="200" defaultValue={r.tables_count} /></label>
          </div>
          <button>Guardar</button>
        </form>
      </details>

      <div className="panel">
        <form action={saveCategory} className="row">
          <label>Nueva categoría<input name="name" placeholder="Entradas, Platos fuertes, Bebidas…" required /></label>
          <label>Orden<input name="position" type="number" defaultValue={categories.length} /></label>
          <button>Crear categoría</button>
        </form>
      </div>

      {categories.length === 0 && <p className="muted">Empieza creando una categoría y luego agrega platos.</p>}

      {categories.map((c) => (
        <div className="panel" key={c.id}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <form action={saveCategory} className="row" style={{ flex: 1 }}>
              <input type="hidden" name="id" value={c.id} />
              <input name="name" defaultValue={c.name} style={{ fontWeight: 700 }} />
              <input name="position" type="number" defaultValue={c.position} style={{ maxWidth: 80 }} title="Orden" />
              <button className="ghost">Renombrar</button>
            </form>
            <form action={deleteCategory}>
              <input type="hidden" name="id" value={c.id} />
              <button className="danger" title="Borra la categoría y sus platos">Eliminar</button>
            </form>
          </div>

          {items.filter((i) => i.category_id === c.id).map((i) => (
            <details key={i.id} style={{ borderTop: "1px solid var(--line)", padding: ".7rem 0" }}>
              <summary>
                <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {i.image_url ? <img className="thumb" src={i.image_url} alt="" /> : <span className="thumb" style={{ background: "#eee", display: "grid", placeItems: "center" }}>🍽️</span>}
                  <span>{i.name} {!i.available && <span className="pill">agotado</span>}</span>
                </span>
                <span>{formatMoney(i.price_cents, r.currency)}</span>
              </summary>
              <div style={{ paddingTop: 12 }}>
                <ItemForm item={i} categories={categories} />
                <div className="row" style={{ marginTop: 8 }}>
                  <form action={toggleAvailable}><input type="hidden" name="id" value={i.id} /><button className="ghost">{i.available ? "Marcar agotado" : "Marcar disponible"}</button></form>
                  <form action={deleteItem}><input type="hidden" name="id" value={i.id} /><button className="danger">Eliminar plato</button></form>
                </div>
              </div>
            </details>
          ))}

          <details style={{ borderTop: "1px solid var(--line)", paddingTop: ".7rem" }}>
            <summary>+ Agregar plato a {c.name}</summary>
            <div style={{ paddingTop: 12 }}><ItemForm categories={categories} catId={c.id} /></div>
          </details>
        </div>
      ))}
    </>
  );
}
