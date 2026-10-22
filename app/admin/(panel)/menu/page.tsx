import { requireAdmin } from "@/lib/auth";
import { query, type Category, type Item } from "@/lib/db";
import SaveForm from "@/components/SaveForm";
import { deleteCategory, deleteItem, saveCategory, saveItem, saveSettings } from "../../actions";

export const dynamic = "force-dynamic";

function ItemFields({ item, categories, catId }: { item?: Item; categories: Category[]; catId?: number }) {
  return (
    <>
      {item && <input type="hidden" name="id" value={item.id} />}
      <div className="item-edit">
        <div className="item-photo">
          {item?.image_url ? <img src={item.image_url} alt="" /> : <span>🍽️<br />Sin foto</span>}
        </div>
        <div className="item-fields">
          <div className="row">
            <label>Nombre<input name="name" defaultValue={item?.name} required maxLength={80} /></label>
            <label>Precio<input name="price" type="number" step="0.01" min="0" defaultValue={item ? item.price_cents / 100 : ""} required /></label>
          </div>
          <label>Descripción<textarea name="description" defaultValue={item?.description} rows={2} maxLength={300} /></label>
          <div className="row">
            <label>
              Categoría
              <select name="category_id" defaultValue={item?.category_id ?? catId}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label>Etiquetas (coma)<input name="tags" defaultValue={item?.tags} placeholder="vegano, sin gluten" /></label>
          </div>
          <div className="row">
            <label>Cambiar foto (archivo)<input type="file" name="image" accept="image/*" /></label>
            <label>o URL de foto<input name="image_url" defaultValue={item?.image_url} placeholder="https://…" /></label>
          </div>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" name="available" defaultChecked={item ? !!item.available : true} style={{ width: "auto" }} /> Disponible (si lo desmarcas, no aparece como pedido pero sigue en la carta)
          </label>
        </div>
      </div>
    </>
  );
}

export default async function MenuAdmin() {
  const r = await requireAdmin();
  const categories = await query<Category>("SELECT * FROM categories WHERE restaurant_id = ? ORDER BY position, id", [r.id]);
  const items = await query<Item>("SELECT * FROM items WHERE restaurant_id = ? ORDER BY position, id", [r.id]);

  return (
    <>
      <div className="row" style={{ alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Editar carta</h1>
        <a className="btn ghost" href={`/r/${r.slug}`} target="_blank" style={{ flex: "0 0 auto" }}>👁️ Ver carta pública</a>
      </div>
      <p className="muted">Cambia lo que quieras y pulsa <strong>Guardar</strong> en cada plato. Los cambios se ven al instante en la carta del cliente.</p>

      <SaveForm action={saveSettings} label="💾 Guardar datos del restaurante" className="panel">
        <h2>Datos del restaurante</h2>
        <div className="row">
          <label>Nombre<input name="name" defaultValue={r.name} required /></label>
          <label>Moneda (3 letras)<input name="currency" defaultValue={r.currency} maxLength={3} /></label>
          <label>Color<input name="accent" type="color" defaultValue={r.accent} style={{ height: 42, padding: 2 }} /></label>
          <label>Mesas<input name="tables_count" type="number" min="1" max="200" defaultValue={r.tables_count} /></label>
        </div>
        <label>Descripción corta<textarea name="description" defaultValue={r.description} rows={2} maxLength={200} /></label>
      </SaveForm>

      {categories.map((c) => (
        <section className="panel" key={c.id}>
          <SaveForm action={saveCategory} label="💾 Guardar nombre" className="cat-head">
            <input type="hidden" name="id" value={c.id} />
            <div className="row">
              <label>Categoría<input name="name" defaultValue={c.name} style={{ fontWeight: 700 }} /></label>
              <label style={{ maxWidth: 90 }}>Orden<input name="position" type="number" defaultValue={c.position} /></label>
            </div>
          </SaveForm>

          {items.filter((i) => i.category_id === c.id).map((i) => (
            <div className="item-card" key={i.id}>
              <SaveForm action={saveItem} label="💾 Guardar cambios">
                <ItemFields item={i} categories={categories} />
              </SaveForm>
              <SaveForm action={deleteItem} label="🗑️ Eliminar plato" danger confirm={`¿Eliminar "${i.name}"?`} doneLabel="Eliminado">
                <input type="hidden" name="id" value={i.id} />
              </SaveForm>
            </div>
          ))}

          <div className="item-card new">
            <h3>➕ Agregar plato a {c.name}</h3>
            <SaveForm action={saveItem} label="➕ Agregar plato" doneLabel="✓ Plato agregado" resetOnSave>
              <ItemFields categories={categories} catId={c.id} />
            </SaveForm>
          </div>

          <SaveForm action={deleteCategory} label="Eliminar categoría y sus platos" ghost confirm={`¿Eliminar la categoría "${c.name}" con todos sus platos?`} doneLabel="Eliminada">
            <input type="hidden" name="id" value={c.id} />
          </SaveForm>
        </section>
      ))}

      <SaveForm action={saveCategory} label="➕ Crear categoría" doneLabel="✓ Categoría creada" resetOnSave className="panel">
        <h2>Nueva categoría</h2>
        <div className="row">
          <label>Nombre<input name="name" placeholder="Entradas, Bebidas, Postres…" required /></label>
          <label style={{ maxWidth: 90 }}>Orden<input name="position" type="number" defaultValue={categories.length} /></label>
        </div>
      </SaveForm>
    </>
  );
}
