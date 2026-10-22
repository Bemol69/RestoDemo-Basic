import { requireAdmin } from "@/lib/auth";
import { query, type Category, type Item } from "@/lib/db";
import SaveForm from "@/components/SaveForm";
import { deleteCategory, deleteItem, saveCategory, saveItem, saveSettings } from "../../actions";

export const dynamic = "force-dynamic";

const TAGS = ["vegano", "vegetariano", "sin gluten", "picante"];

function DishFields({ item, categories, catId }: { item?: Item; categories: Category[]; catId?: number }) {
  const tags = item?.tags.split(",") ?? [];
  return (
    <>
      {item && <input type="hidden" name="id" value={item.id} />}
      {!(item && categories.length > 1) && <input type="hidden" name="category_id" value={item?.category_id ?? catId} />}
      <div className="dish-grid">
        <div className="photo-box">
          <div className="preview">{item?.image_url ? <img src={item.image_url} alt="" /> : <span>Sin foto</span>}</div>
          <input type="file" name="image" accept="image/*" aria-label="Elegir foto" />
        </div>
        <div>
          <div className="row">
            <label>Nombre del plato<input name="name" defaultValue={item?.name} required maxLength={80} /></label>
            <label style={{ maxWidth: 170 }}>Precio<input name="price" type="number" step="0.01" min="0" defaultValue={item ? item.price_cents / 100 : ""} required /></label>
          </div>
          <label>Descripción<textarea name="description" defaultValue={item?.description} rows={2} maxLength={300} /></label>
          <div className="tag-pick">
            {TAGS.map((t) => (
              <label key={t}><input type="checkbox" name="tags" value={t} defaultChecked={tags.includes(t)} /> {t}</label>
            ))}
          </div>
          {categories.length > 1 && item && (
            <details className="more">
              <summary>Mover a otra categoría</summary>
              <select name="category_id" defaultValue={item.category_id}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </details>
          )}
          <label className="switch">
            <input type="checkbox" name="available" defaultChecked={item ? !!item.available : true} /> Disponible hoy
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
      <div className="page-title">
        <h1>Mi carta</h1>
        <a className="btn ghost" href={`/r/${r.slug}`} target="_blank">Ver como cliente ↗</a>
      </div>

      <div className="help">
        <span><b>1.</b> Cambia lo que quieras en el plato</span>
        <span><b>2.</b> Pulsa el botón verde <b>Guardar</b></span>
        <span><b>3.</b> Listo: el cliente lo ve al instante</span>
      </div>

      {categories.map((c) => (
        <section className="cat-block" key={c.id}>
          <div className="cat-title">
            <SaveForm action={saveCategory} label="Guardar nombre" ghost>
              <input type="hidden" name="id" value={c.id} />
              <input type="hidden" name="position" value={c.position} />
              <div className="row" style={{ alignItems: "center" }}>
                <input name="name" defaultValue={c.name} aria-label="Nombre de la categoría" style={{ fontFamily: "var(--serif)", fontSize: "1.3rem", fontWeight: 700 }} />
              </div>
            </SaveForm>
          </div>

          {items.filter((i) => i.category_id === c.id).map((i) => (
            <div className="dish" key={i.id}>
              <SaveForm action={saveItem} label="💾 Guardar">
                <DishFields item={i} categories={categories} />
              </SaveForm>
              <SaveForm action={deleteItem} label="Eliminar este plato" danger confirm={`¿Eliminar "${i.name}"?`} doneLabel="Eliminado">
                <input type="hidden" name="id" value={i.id} />
              </SaveForm>
            </div>
          ))}

          <div className="dish new">
            <h3>➕ Nuevo plato en {c.name}</h3>
            <SaveForm action={saveItem} label="➕ Agregar plato" doneLabel="✓ Plato agregado" resetOnSave>
              <DishFields categories={categories} catId={c.id} />
            </SaveForm>
          </div>

          <div className="cat-foot">
            <SaveForm action={deleteCategory} label="Eliminar categoría" danger confirm={`¿Eliminar "${c.name}" con todos sus platos?`} doneLabel="Eliminada">
              <input type="hidden" name="id" value={c.id} />
            </SaveForm>
          </div>
        </section>
      ))}

      <SaveForm action={saveCategory} label="➕ Crear categoría" doneLabel="✓ Categoría creada" resetOnSave className="panel">
        <h2>Nueva categoría</h2>
        <p className="muted">Por ejemplo: Entradas, Bebidas, Postres.</p>
        <input type="hidden" name="position" value={categories.length} />
        <label>Nombre<input name="name" required /></label>
      </SaveForm>

      <SaveForm action={saveSettings} label="💾 Guardar datos" className="panel">
        <h2>Datos del restaurante</h2>
        <div className="row">
          <label>Nombre<input name="name" defaultValue={r.name} required /></label>
          <label style={{ maxWidth: 140 }}>Cantidad de mesas<input name="tables_count" type="number" min="1" max="200" defaultValue={r.tables_count} /></label>
        </div>
        <label>Descripción corta<textarea name="description" defaultValue={r.description} rows={2} maxLength={200} /></label>
      </SaveForm>
    </>
  );
}
