import { requireAdmin } from "@/lib/auth";
import { query, type Category, type Item } from "@/lib/db";
import SaveForm from "@/components/SaveForm";
import { saveAll } from "../../actions";

export const dynamic = "force-dynamic";

const TAGS = ["vegano", "vegetariano", "sin gluten", "picante"];

// Every field is named "<prefix>.<field>" so the single "Guardar todo" form can send everything at once.
function DishFields({ prefix, item, categories }: { prefix: string; item?: Item; categories?: Category[] }) {
  const tags = item?.tags.split(",") ?? [];
  return (
    <div className="dish-grid">
      <div className="photo-box">
        <div className="preview">{item?.image_url ? <img src={item.image_url} alt="" /> : <span>Sin foto</span>}</div>
        <input type="file" name={`${prefix}.image`} accept="image/*" aria-label="Elegir foto" />
      </div>
      <div>
        <div className="row">
          <label>Nombre del plato<input name={`${prefix}.name`} defaultValue={item?.name} maxLength={80} /></label>
          <label style={{ maxWidth: 170 }}>Precio<input name={`${prefix}.price`} type="number" step="0.01" min="0" defaultValue={item ? item.price_cents / 100 : ""} /></label>
        </div>
        <label>Descripción<textarea name={`${prefix}.description`} defaultValue={item?.description} rows={2} maxLength={300} /></label>
        <div className="tag-pick">
          {TAGS.map((t) => (
            <label key={t}><input type="checkbox" name={`${prefix}.tags`} value={t} defaultChecked={tags.includes(t)} /> {t}</label>
          ))}
        </div>
        {item && categories && categories.length > 1 && (
          <details className="more">
            <summary>Mover a otra categoría</summary>
            <select name={`${prefix}.category_id`} defaultValue={item.category_id}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </details>
        )}
        <label className="switch">
          <input type="checkbox" name={`${prefix}.available`} defaultChecked={item ? !!item.available : true} /> Disponible hoy
        </label>
        {item && (
          <label className="remove">
            <input type="checkbox" name={`${prefix}.delete`} /> Eliminar este plato al guardar
          </label>
        )}
      </div>
    </div>
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
        <span><b>1.</b> Cambia lo que quieras</span>
        <span><b>2.</b> Pulsa <b>Guardar todo</b> (botón verde de abajo)</span>
        <span><b>3.</b> Listo: el cliente lo ve al instante</span>
      </div>

      <SaveForm action={saveAll} label="💾 Guardar todo" clearPrefix="new" sticky>
        {categories.map((c) => (
          <section className="cat-block" key={c.id}>
            <div className="cat-title">
              <input name={`c.${c.id}.name`} defaultValue={c.name} aria-label="Nombre de la categoría" className="cat-name" />
              <label className="remove"><input type="checkbox" name={`c.${c.id}.delete`} /> Eliminar categoría y sus platos</label>
            </div>

            {items.filter((i) => i.category_id === c.id).map((i) => (
              <div className="dish" key={i.id}>
                <input type="hidden" name={`i.${i.id}.present`} value="1" />
                <DishFields prefix={`i.${i.id}`} item={i} categories={categories} />
              </div>
            ))}

            <div className="dish new">
              <h3>➕ Nuevo plato en {c.name}</h3>
              <p className="muted" style={{ fontSize: ".85rem" }}>Si le pones nombre, se agrega al guardar.</p>
              <DishFields prefix={`new.${c.id}`} />
            </div>
          </section>
        ))}

        <div className="panel">
          <h2>Nueva categoría</h2>
          <p className="muted">Por ejemplo: Entradas, Bebidas, Postres. Se crea al guardar.</p>
          <label>Nombre<input name="newcat.name" /></label>
        </div>

        <div className="panel">
          <h2>Datos del restaurante</h2>
          <div className="row">
            <label>Nombre<input name="s.name" defaultValue={r.name} /></label>
            <label style={{ maxWidth: 140 }}>Cantidad de mesas<input name="s.tables_count" type="number" min="1" max="200" defaultValue={r.tables_count} /></label>
          </div>
          <label>Descripción corta<textarea name="s.description" defaultValue={r.description} rows={2} maxLength={200} /></label>
        </div>
      </SaveForm>
    </>
  );
}
