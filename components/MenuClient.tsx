"use client";

import { useEffect, useMemo, useState } from "react";
import type { Category, Item, Restaurant } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import Logo from "@/components/Logo";

type Props = { restaurant: Restaurant; categories: Category[]; items: Item[]; table: string };

export default function MenuClient({ restaurant: r, categories, items, table }: Props) {
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("");
  const [open, setOpen] = useState<Item | null>(null);
  const [callOpen, setCallOpen] = useState(false);
  const [tableInput, setTableInput] = useState(table);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [callId, setCallId] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  const money = (c: number) => formatMoney(c, r.currency);
  const allTags = useMemo(() => [...new Set(items.flatMap((i) => i.tags.split(",").filter(Boolean)))].sort(), [items]);
  const visible = items.filter((i) => {
    const q = search.trim().toLowerCase();
    if (q && !(i.name + " " + i.description + " " + i.tags).toLowerCase().includes(q)) return false;
    return !tag || i.tags.split(",").includes(tag);
  });

  async function callWaiter() {
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: r.slug, table: tableInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo avisar al mesero.");
      setCallId(data.id);
      setAnswered(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSending(false);
    }
  }

  // After calling, wait until the waiter marks the call as attended.
  useEffect(() => {
    if (!callId || answered) return;
    const t = setInterval(async () => {
      const res = await fetch(`/api/calls/${callId}?slug=${r.slug}`, { cache: "no-store" });
      if (res.ok && (await res.json()).status === "atendido") setAnswered(true);
    }, 3000);
    return () => clearInterval(t);
  }, [callId, answered, r.slug]);

  const closeCall = () => {
    setCallOpen(false);
    if (answered) setCallId(null);
  };

  return (
    <>
    <div className="menu-top">
      <div className="wrap">
        <Logo href="/" light />
        {table && <span className="mesa-badge">Mesa {table}</span>}
      </div>
    </div>
    <div className="menu">
      <header className="menu-hero">
        <p className="eyebrow">Nuestra carta</p>
        <h1>{r.name}</h1>
        {r.description && <p className="muted">{r.description}</p>}
      </header>

      <div className="menu-tools">
        <input type="search" placeholder="Buscar platos…" value={search} onChange={(e) => setSearch(e.target.value)} />
        {allTags.length > 0 && (
          <div className="chips">
            <button className={!tag ? "chip on" : "chip"} onClick={() => setTag("")}>Todo</button>
            {allTags.map((t) => (
              <button key={t} className={tag === t ? "chip on" : "chip"} onClick={() => setTag(tag === t ? "" : t)}>{t}</button>
            ))}
          </div>
        )}
        <nav className="chips">
          {categories.map((c) => <a key={c.id} href={`#cat-${c.id}`} className="chip">{c.name}</a>)}
        </nav>
      </div>

      {categories.map((c) => {
        const list = visible.filter((i) => i.category_id === c.id);
        if (!list.length) return null;
        return (
          <section key={c.id} id={`cat-${c.id}`}>
            <h2>{c.name}</h2>
            <div className="grid">
              {list.map((i) => (
                <article key={i.id} className="card" onClick={() => setOpen(i)}>
                  <div className="card-media">
                    {i.image_url ? <img src={i.image_url} alt={i.name} loading="lazy" /> : <span className="noimg">🍽️</span>}
                  </div>
                  <div className="card-body">
                    <h3>{i.name}</h3>
                    {i.description && <p className="muted clamp">{i.description}</p>}
                    <strong>{money(i.price_cents)}</strong>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
      {visible.length === 0 && <p className="muted center">No encontramos nada con ese filtro.</p>}

      <button className={callId && !answered ? "call-fab waiting" : "call-fab"} onClick={() => setCallOpen(true)}>
        {callId && !answered ? "⏳ Mesero avisado" : "🔔 Llamar al mesero"}
      </button>

      {open && (
        <div className="sheet-bg" onClick={() => setOpen(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setOpen(null)} aria-label="Cerrar">×</button>
            {open.image_url && <img src={open.image_url} alt={open.name} />}
            <h3>{open.name}</h3>
            <p className="muted">{open.description}</p>
            {open.tags && <div className="chips">{open.tags.split(",").map((t) => <span key={t} className="chip">{t}</span>)}</div>}
            <p><strong>{money(open.price_cents)}</strong></p>
          </div>
        </div>
      )}

      {callOpen && (
        <div className="sheet-bg" onClick={closeCall}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={closeCall} aria-label="Cerrar">×</button>
            {callId ? (
              <div className="center">
                <div className="wait-ico">{answered ? "✅" : "🚶"}</div>
                <h3>{answered ? "¡Tu mesero ya te atiende!" : "Mesero avisado"}</h3>
                <p className="muted">
                  {answered
                    ? `Enseguida está contigo en la mesa ${tableInput}.`
                    : `Ya le avisamos que estás en la mesa ${tableInput}. Un momento por favor.`}
                </p>
                <button className="ghost" onClick={closeCall}>Cerrar</button>
              </div>
            ) : (
              <>
                <h3>Llamar al mesero</h3>
                <p className="muted">Indica en qué mesa estás para que sepa dónde ir.</p>
                <label>
                  Número de mesa
                  <input value={tableInput} onChange={(e) => setTableInput(e.target.value)} inputMode="numeric" placeholder="Ej: 4" maxLength={20} autoFocus />
                </label>
                {error && <p className="err">{error}</p>}
                <button className="add big" disabled={sending || !tableInput.trim()} onClick={callWaiter}>
                  {sending ? "Avisando…" : "Llamar ahora"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
    </>
  );
}
